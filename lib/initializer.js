'use strict';

var request = require('request');
var fs = require('fs');

var config = require('../lib/config');
var UrlGenerator = require('../lib/urlGenerator');

var Initializer = {};

Initializer.configs = config.project;
Initializer.urlGen = new UrlGenerator(Initializer.configs.project);

/*
    Filters unwanted data from the page response.
*/
var filterPageData = function(category) {
    var pages = [];

    category.pages.forEach(function(page) {
        pages.push({
            body: page.body,
            excerpt: page.excerpt,
            title: page.title,
            slug: page.slug
        });
    });

    return pages;
};

/*
    Filters unwanted information from the category response and filters the page data.
*/
var filterCategoryData = function(category) {
    return {
        slug: category.slug,
        title: category.title,
        pages: filterPageData(category)
    };
};

/*
    Creates an array of filtered document objects
*/
var filterDocData = function(docs) {
    var documentation = [];

    docs.forEach(function(category) {
        documentation.push(filterCategoryData(category));
    });

    return documentation;
};

/*
    Filters out unwanted fields from the page response.
*/
var filterCustomPage = function(page) {
    return {
        title: page.title,
        body: page.body,
        html: page.html,
        slug: page.slug
    };
};

/*
    Creates array of filtered page data objects.
*/
var filterCustomPages = function(pages) {
    var customPages = [];

    pages.forEach(function(page) {
        customPages.push(filterCustomPage(page));
    });

    return customPages;
};

/*
    Filters everything but the custom content we care about.
*/
var filterContent = function(customContent) {
    var appearance = customContent.appearance;

    return {
        appearance: {
            html_body: appearance.html_body,
            stylesheet: appearance.stylesheet
        }
    };
};

/*
    Each type of content needs to be requested for each version of the project.
    This function generates another function which accepts a registry object and urlGenerators.
    A request is made for each UrlGenerator and combined into the single registry object.
*/
var buildRecursiveRequestor = function(subSection, filterFn, urlFn, cb) {
    var urlGenIdx = 0;

    var recursiveRequest = function(registry, urlGens) {
        if (urlGenIdx === urlGens.length) {
            return cb(registry);
        }

        var urlGen = urlGens[urlGenIdx++];

        request.get({ url: urlGen[urlFn](), cookie: Initializer.cookie }, function(err, response, body) {
            if (err) {
                throw Error('Docs at ' + urlGen[urlFn]() + ' failed to download:\n' + err);
            }

            registry.versions[urlGen.version] = {};
            registry.versions[urlGen.version][subSection] = filterFn(JSON.parse(body));

            return recursiveRequest(registry, urlGens);
        });
    };

    return recursiveRequest;
};

/*
    Fetches documentation data for each version of the project
*/
var fetchDocumentation = function(urlGenerators, cb) {
    var recursiveRequest = buildRecursiveRequestor('documentation', filterDocData, 'docsUrl', cb);

    var docsRegistry = { versions: {} };
    recursiveRequest(docsRegistry, urlGenerators);
};

/*
    Fetches the data for custom pages for each version
*/
var fetchCustomPages = function(urlGenerators, cb) {
    var recursiveRequest = buildRecursiveRequestor('customPages', filterCustomPages, 'pagesUrl', cb);

    var customPagesRegistry = { versions: {} };
    recursiveRequest(customPagesRegistry, urlGenerators);
};

/*
    Fetches content like custom landing html and stylesheet data for each version
*/
var fetchContent = function(urlGenerators, cb) {
    var recursiveRequest = buildRecursiveRequestor('content', filterContent, 'contentUrl', cb);

    var customContentRegistry = { versions: {} };
    recursiveRequest(customContentRegistry, urlGenerators);
};

/*
    Merges data from the 3 seperate api calls into 1 object
*/
var mergeRegistries = function(docsReg, pageReg, contentReg) {
    var merged = { versions: {} };

    Object.keys(docsReg.versions).forEach(function(version) {
        merged.versions[version] = {};

        merged.versions[version].documentation = docsReg.versions[version].documentation;
        merged.versions[version].content = contentReg.versions[version].content;
        merged.versions[version].customPages = pageReg.versions[version].customPages;
    });

    return merged;
};

/*
    Downloads documentation, custom pages and custom content and saves to a registry file.
*/
var createProjectRegistry = function(versions, cb) {
    var urlGenerators = [];

    versions.forEach(function(version) {
        urlGenerators.push(new UrlGenerator(Initializer.configs.project, 'v' + version.version));
    });

    fetchDocumentation(urlGenerators, function(docsRegistry) {
        fetchCustomPages(urlGenerators, function(pagesRegistry) {
            fetchContent(urlGenerators, function(contentRegistry) {
                var registry = mergeRegistries(docsRegistry, pagesRegistry, contentRegistry);

                registry.slug = Initializer.configs.project;

                fs.writeFile('syncRegistry.json', JSON.stringify(registry, null, 4), function(err) {
                    if (err) {
                        throw Error('Error file creating registry file:\n' + err);
                    }
                    cb(registry);
                });
            });
        });
    });
};

/*
    Downloads the version data for the project
*/
var fetchVersions = function(cb) {
    request.get({ url: Initializer.urlGen.versionsUrl(), cookie: Initializer.cookie }, function(err, response, body) {
        if (err) {
            throw new Error('Versions could not be downloaded:\n' + err);
        } else {
            cb(JSON.parse(body));
        }
    });
};

Initializer.initProjectInfo = function(cookie, cb) {
    this.cookie = cookie;
    fetchVersions(function(versions) {
        createProjectRegistry(versions, cb);
    });
};

module.exports = Initializer;
