'use strict';

var request = require('request');
var _ = require('lodash');

var Requestor = function(cookie, urlGens) {
    this.urlGens = urlGens;
    this.cookie = cookie;
    this.cache = {};
};

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

Requestor.prototype.isCached = function(urlGen, subSection) {
    return _.has(this.cache, [urlGen.slug, urlGen.version, subSection]);
};

/*
    Each type of content needs to be requested for each version of the project.
    This function generates another function which accepts a registry object and urlGenerators.
    A request is made for each UrlGenerator and combined into the single registry object.
*/
Requestor.prototype.buildRecursiveRequestor = function(subSection, filterFn, urlFn, cb) {
    var urlGenIdx = 0;
    var self = this;

    var recursiveRequest = function(registry, urlGens) {
        if (urlGenIdx === urlGens.length) {
            return cb(registry);
        }

        var urlGen = urlGens[urlGenIdx++];

        // Always using the cache for our base registry
        if (self.isCached(urlGen, subSection)) {
            return recursiveRequest(registry, urlGens);
        }

        request.get({ url: urlGen[urlFn](), jar: self.cookie }, function(err, response, body) {
            if (err) {
                throw Error('Docs at ' + urlGen[urlFn]() + ' failed to download:\n' + err);
            }

            var regSlug = registry[urlGen.slug] = registry[urlGen.slug] || {};
            var regVersion = regSlug[urlGen.version] = regSlug[urlGen.version] || {};

            regVersion[subSection] = filterFn(JSON.parse(body));

            self.cache = registry;
            return recursiveRequest(registry, urlGens);
        });
    };

    return recursiveRequest;
};

/*
    Fetches documentation data for each version of the project
*/
Requestor.prototype.documentation = function(cb) {
    var recursiveRequest = this.buildRecursiveRequestor('documentation', filterDocData, 'docsUrl', cb);

    recursiveRequest(this.cache, this.urlGens);
};

/*
    Fetches the data for custom pages for each version
*/
Requestor.prototype.customPages = function(cb) {
    var recursiveRequest = this.buildRecursiveRequestor('customPages', filterCustomPages, 'pagesUrl', cb);

    recursiveRequest(this.cache, this.urlGens);
};

/*
    Fetches content like custom landing html and stylesheet data for each version
*/
Requestor.prototype.customContent = function(cb) {
    var recursiveRequest = this.buildRecursiveRequestor('customContent', filterContent, 'contentUrl', cb);

    recursiveRequest(this.cache, this.urlGens);
};

module.exports = Requestor;
