'use strict';

var config = require('./config');

var UrlGenerator = function(slug, version) {
    this.slug = slug;
    this.version = version;
};

UrlGenerator.base = config.project.apiBase;

var sanitizeSlug = function(slug) {
    return typeof slug !== 'undefined' ? '/' + slug : '';
};

UrlGenerator.prototype.base = function() {
    return UrlGenerator.base;
};

UrlGenerator.prototype.apiBase = function() {
    return this.base() + '/api';
};

UrlGenerator.prototype.docsPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/docs' + sanitizeSlug(slug);
};

UrlGenerator.prototype.docsUrl = function() {
    return this.base() + this.docsPath();
};

UrlGenerator.prototype.docsPostUrl = function(categorySlug) {
    return this.base() + this.docsPath(categorySlug);
};

UrlGenerator.prototype.docsPutUrl = function(docSlug) {
    return this.base() + this.docsPath(docSlug);
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

UrlGenerator.prototype.pagesPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/page' + sanitizeSlug(slug);
};

UrlGenerator.prototype.pagesUrl = function(slug) {
    return this.base() + this.pagesPath(slug);
};

module.exports = UrlGenerator;
