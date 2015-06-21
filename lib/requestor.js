'use strict';

var fs = require('fs');
var request = require('request');
var _ = require('lodash');

var UrlGenerator = require('./urlGenerator');

var Requestor = function(cookie, projectName) {
    this.projectName = projectName;
    this.cookie = cookie;
    this.cache = {};
};

/*
    FILTERS
    ******************
*/

// Filters unwanted data from the page response.
var filterPageData = function(category) {
    var pages = [];

    category.pages.forEach(function(page) {
        pages.push({
            body: page.body,
            excerpt: page.excerpt,
            title: page.title,
            slug: page.slug,
            type: page.type
        });
    });

    return pages;
};


// Filters unwanted information from the category response and filters the page data.
var filterCategoryData = function(category) {
    return {
        slug: category.slug,
        title: category.title,
        pages: filterPageData(category)
    };
};


// Creates an array of filtered document objects
var filterDocData = function(docs) {
    var documentation = [];

    docs.forEach(function(category) {
        documentation.push(filterCategoryData(category));
    });

    return documentation;
};


// Filters out unwanted fields from the page response.
var filterCustomPage = function(page) {
    return {
        title: page.title,
        body: page.body,
        html: page.html,
        slug: page.slug
    };
};


// Creates array of filtered page data objects.
var filterCustomPages = function(pages) {
    var customPages = [];

    pages.forEach(function(page) {
        customPages.push(filterCustomPage(page));
    });

    return customPages;
};


// Filters everything but the custom content we care about.
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
    GET REQUEST FUNCTIONS
    **********************
*/

// Checks if the requested resource has been already downloaded
Requestor.prototype.isCached = function(resource, subSection) {
    return _.has(this.cache, [this.projectName, resource.version, subSection]);
};

// Each type of content needs to be requested for each version of the project.
// This function generates another function which accepts a registry object and resources.
// A request is made for each resource and combined into the single registry object.
Requestor.prototype.buildRecursiveGetRequestFn = function(subSection, filterFn, urlFn, cb) {
    var resourceIdx = 0;
    var self = this;

    var recursiveRequest = function(registry, resources) {
        if (resourceIdx === resources.length) {
            return cb(registry);
        }

        var resource = resources[resourceIdx++];
        var urlGen = new UrlGenerator(self.projectName, resource.version);

        // Always using the cache for our base registry
        if (self.isCached(resource, subSection)) {
            return recursiveRequest(registry, resources);
        }

        request.get({ url: urlGen[urlFn](), jar: self.cookie }, function(err, response, body) {
            if (err) {
                throw Error('Docs at ' + urlGen[urlFn]() + ' failed to download:\n' + err);
            }

            var regSlug = registry[self.projectName] = registry[self.projectName] || {};
            var regVersion = regSlug[resource.version] = regSlug[resource.version] || {};

            regVersion[subSection] = filterFn(JSON.parse(body));

            self.cache = registry;
            return recursiveRequest(registry, resources);
        });
    };

    return recursiveRequest;
};


// Fetches documentation data for each version of the project
Requestor.prototype.documentation = function(resources, cb) {
    var recursiveRequest = this.buildRecursiveGetRequestFn('documentation', filterDocData, 'docsUrl', cb);

    recursiveRequest(this.cache, resources);
};


// Fetches the data for custom pages for each version
Requestor.prototype.customPages = function(resources, cb) {
    var recursiveRequest = this.buildRecursiveGetRequestFn('customPages', filterCustomPages, 'pagesUrl', cb);

    recursiveRequest(this.cache, resources);
};


// Fetches content like custom landing html and stylesheet data for each version
Requestor.prototype.customContent = function(resources, cb) {
    var recursiveRequest = this.buildRecursiveGetRequestFn('customContent', filterContent, 'contentUrl', cb);

    recursiveRequest(this.cache, resources);
};


/*
    POST/PUT REQUEST FUNCTIONS
    ***************************
*/

Requestor.prototype.buildRecursiveUploadRequestFn = function(createBodyFn, urlFns, cb) {
    var resourceIdx = 0;
    var self = this;
    var failedResources = [];

    var uploadResource = function(resource, requestCb) {
        var requestSettings = {};
        var urlGen = new UrlGenerator(self.projectName, resource.version);

        // Slug is generated by the server. Lack of one means it's still local only.
        if (typeof resource.slug === 'undefined') {
            requestSettings.method = 'POST';
            requestSettings.url = urlGen[urlFns.post](resource.categorySlug);
        } else {
            requestSettings.method = 'PUT';
            requestSettings.url = urlGen[urlFns.put](resource.slug);
        }

        requestSettings.headers = {'Content-Type': 'application/json' };
        requestSettings.jar = self.cookie;
        requestSettings.body = createBodyFn(resource);

        request(requestSettings, requestCb);
    };

    var recursiveRequest = function(resources) {
        if (resourceIdx === resources.length) {
            return cb(failedResources);
        }

        var resource = resources[resourceIdx++];
        uploadResource(resource, function(err, response, body) {
            if (err || response.statusCode !== 200) {
                console.log(err);
                failedResources.push(resource);
            } else {
                var respBody = JSON.parse(body);
                resource.title = respBody.title;
                resource.slug = respBody.slug;
                resource.excerpt = respBody.excerpt;
                if (resource.body) {
                    fs.writeFileSync(resource.body, respBody.body);
                }
            }
            return recursiveRequest(resources);
        });
    };

    return recursiveRequest;
};


// Uploads categories used to group pages of documentation.
Requestor.prototype.uploadDocCategories = function(resources, cb) {
    var urlFns = { post: 'docCategoriesPostUrl', put: 'docCategoriesPutUrl' };
    var createBodyFn = function(resource) {
        return JSON.stringify({ title: resource.title });
    };
    var recursiveRequest = this.buildRecursiveUploadRequestFn(createBodyFn, urlFns, cb);

    recursiveRequest(resources);
};


Requestor.prototype.uploadDocs = function(resources, cb) {
    var urlFns = { post: 'docsPostUrl', put: 'docsPutUrl' };
    var createBodyFn = function(resource) {
        return JSON.stringify({
            title: resource.title,
            excerpt: resource.excerpt,
            body: fs.readFileSync(resource.body).toString(),
            type: resource.type
        });
    };
    var recursiveRequest = this.buildRecursiveUploadRequestFn(createBodyFn, urlFns, cb);

    recursiveRequest(resources);
};

Requestor.prototype.uploadPages = function(resources, cb) {
    var urlFns = { post: 'pagesPostUrl', put: 'pagesPutUrl' };
    var createBodyFn = function(resource) {
        return JSON.stringify({
            title: resource.title,
            body: fs.readFileSync(resource.body).toString()
        });
    };
    var recursiveRequest = this.buildRecursiveUploadRequestFn(createBodyFn, urlFns, cb);

    recursiveRequest(resources);
};

module.exports = Requestor;
