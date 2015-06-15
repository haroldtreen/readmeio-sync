'use strict';

var config = require('../lib/config');

var UrlGenerator = function(slug, version) {
    this.slug = slug;
    this.version = version;
};

UrlGenerator.base = config.project.apiBase;

UrlGenerator.prototype.base = function() {
    return UrlGenerator.base;
};

UrlGenerator.prototype.apiBase = function() {
    return this.base() + '/api';
};

UrlGenerator.prototype.docsPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version + '/docs';
};

UrlGenerator.prototype.docsUrl = function() {
    return this.base() + this.docsPath();
};

UrlGenerator.prototype.versionsPath = function() {
    return '/api/projects-v/' + this.slug;
};

UrlGenerator.prototype.versionsUrl = function() {
    return this.base() + this.versionsPath();
};

UrlGenerator.prototype.contentPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version;
};

UrlGenerator.prototype.contentUrl = function() {
    return this.base() + this.contentPath();
};

UrlGenerator.prototype.pagesPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version + '/page';
};

UrlGenerator.prototype.pagesUrl = function() {
    return this.base() + this.pagesPath();
};

module.exports = UrlGenerator;
