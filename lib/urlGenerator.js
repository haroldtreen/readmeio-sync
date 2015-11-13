'use strict';

var config = require('./config');

var UrlGenerator = function(slug, version) {
    this.slug = slug;
    this.version = version;
};

UrlGenerator.base = config.apiBase;

var sanitizeSlug = function(slug) {
    return typeof slug !== 'undefined' ? '/' + slug : '';
};

/*
 *  Helper Methods
 */

var METHODS_FOR_TYPE = {
    doc: {
        prefix: 'docs', methods: ['Get', 'Post', 'Put', 'Delete', 'Order']
    },
    category: {
        prefix: 'docCategories', methods: ['Get', 'Post', 'Put', 'Delete', 'Order']
    },
    customContent: {
        prefix: 'content', methods: ['Get', 'Put']
    },
    customPage: {
        prefix: 'pages', methods: ['Get', 'Post', 'Put', 'Delete']
    },
    version: {
        prefix: 'docs', methods: ['get']
    },
    documentation: {
        prefix: 'docs', methods: ['Get', 'Post', 'Put', 'Delete', 'Order']
    }
};

UrlGenerator.methodsForType = function(type) {
    var methodsMap = {};

    if (!METHODS_FOR_TYPE[type]) {
        return {};
    }

    var prefix = METHODS_FOR_TYPE[type].prefix;
    var methods = METHODS_FOR_TYPE[type].methods;

    methods.forEach(function(method) {
        methodsMap[method.toLowerCase()] = prefix + method + 'Url';
    });

    return methodsMap;
};

UrlGenerator.defineUrlMethod = function(prefix) {
    var urlMethod = prefix + 'Url';
    var pathMethod = prefix + 'Path';

    UrlGenerator.prototype[urlMethod] = function(slug) {
        return this.base() + this[pathMethod](slug);
    };
};

/*
 *  Base
 */

UrlGenerator.prototype.base = function() {
    return UrlGenerator.base;
};

UrlGenerator.prototype.apiBase = function() {
    return this.base() + '/api';
};

/*
 *  Documentation
 */

UrlGenerator.prototype.docsGetPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/docs' + sanitizeSlug(slug);
};

UrlGenerator.prototype.docsPostPath = function(categorySlug) {
    return this.docsGetPath(categorySlug);
};

UrlGenerator.prototype.docsPutPath = function(docSlug) {
    return this.docsGetPath(docSlug);
};

UrlGenerator.prototype.docsDeletePath = function(docSlug) {
    return this.docsGetPath(docSlug);
};

UrlGenerator.prototype.docCategoriesPostPath = function() {
    return this.docCategoriesPutPath();
};

UrlGenerator.prototype.docCategoriesPutPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/category' + sanitizeSlug(slug);
};

UrlGenerator.prototype.docCategoriesDeletePath = function(slug) {
    return this.docCategoriesPutPath(slug);
};

UrlGenerator.prototype.docCategoriesOrderPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version + '/reorder-categories';
};

UrlGenerator.prototype.docsOrderPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version + '/reorder-pages';
};

// Generate Url Methods
METHODS_FOR_TYPE.doc.methods.forEach(function(method) {
    ['docs', 'docCategories'].forEach(function(type) {
        UrlGenerator.defineUrlMethod(type + method);
    });
});

/*
 *  Version
 */

UrlGenerator.prototype.versionsGetPath = function() {
    return '/api/projects-v/' + this.slug;
};

UrlGenerator.prototype.versionsGetUrl = function() {
    return this.base() + this.versionsGetPath();
};

/*
 *  Custom Content
 */

UrlGenerator.prototype.contentGetPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version;
};

UrlGenerator.prototype.contentPutPath = function() {
    return this.contentGetPath();
};

METHODS_FOR_TYPE.customContent.methods.forEach(function(method) {
    UrlGenerator.defineUrlMethod('content' + method);
});

/*
 *  Custom Pages
 */

UrlGenerator.prototype.pagesGetPath = function(pageSlug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/page' + sanitizeSlug(pageSlug);
};

UrlGenerator.prototype.pagesPostPath = function() {
    return this.pagesGetPath();
};

UrlGenerator.prototype.pagesPutPath = function(slug) {
    return this.pagesGetPath(slug);
};

UrlGenerator.prototype.pagesDeletePath = function(slug) {
    return this.pagesGetPath(slug);
};

METHODS_FOR_TYPE.customPage.methods.forEach(function(method) {
    UrlGenerator.defineUrlMethod('pages' + method);
});

module.exports = UrlGenerator;
