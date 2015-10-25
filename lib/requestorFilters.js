'use strict';

var _ = require('lodash');

var RequestorFilters = {};

RequestorFilters.docWhitelist = {
    title: 'title',
    slug: 'slug',
    type: 'type',
    body: 'body',
    _id: '_id',
    excerpt: 'excerpt'
};

RequestorFilters.docCategoryWhitelist = _.assign({
    pages: 'pages'
}, RequestorFilters.docWhitelist);

RequestorFilters.pageWhitelist = {
    title: 'title',
    body: 'body',
    html: 'html',
    slug: 'slug'
};

RequestorFilters.contentWhitelist = { appearance: 'appearance' };

RequestorFilters.transform = function(whitelist, input) {
    var output = {};
    Object.keys(whitelist).forEach(function(outputKey) {
        var inputKey = whitelist[outputKey];
        output[outputKey] = input[inputKey];
    });
    return output;
};

RequestorFilters.documentation = function(docs) {
    var self = RequestorFilters;
    var filteredDocumentation = docs.map(function(category) {
        return self.category(category);
    });

    return filteredDocumentation;
};

RequestorFilters.doc = function(doc){
    var filteredDoc = RequestorFilters.transform(RequestorFilters.docWhitelist, doc);
    filteredDoc.excerpt = filteredDoc.excerpt.replace('\n', ' ');

    return filteredDoc;
};

RequestorFilters.category = function(category) {
    var self = RequestorFilters;
    var filteredCategory = RequestorFilters.transform(RequestorFilters.docCategoryWhitelist, category);
    filteredCategory.pages = filteredCategory.pages.map(function(doc) {
        return self.doc(doc);
    });

    return filteredCategory;
};

RequestorFilters.pages = function(pages) {
    var self = RequestorFilters;
    return pages.map(function(page) {
        return self.page(page);
    });
};

RequestorFilters.page = function(page) {
    var filteredPage = RequestorFilters.transform(RequestorFilters.pageWhitelist, page);

    return filteredPage;
};

RequestorFilters.content = function(content) {
    var filteredContent = RequestorFilters.transform(RequestorFilters.contentWhitelist, content);
    var appearance = filteredContent.appearance;
    filteredContent.appearance = {
        html_body: appearance.html_body,
        stylesheet: appearance.stylesheet
    };

    return filteredContent;
};

RequestorFilters.versions = function(versions) {
    var filteredVersions = versions.map(function(version) {
        return { version: 'v' + version.version };
    });

    return filteredVersions;
};

module.exports = RequestorFilters;
