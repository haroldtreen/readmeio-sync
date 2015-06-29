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

UrlGenerator.prototype.docsPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/docs' + sanitizeSlug(slug);
};

UrlGenerator.prototype.docsUrl = function() {
    return this.base() + this.docsPath();
};

UrlGenerator.prototype.docsPostPath = function(categorySlug) {
    return this.docsPath(categorySlug);
};

UrlGenerator.prototype.docsPutPath = function(docSlug) {
    return this.docsPath(docSlug);
};

UrlGenerator.prototype.docsDeletePath = function(docSlug) {
    return this.docsPath(docSlug);
};

UrlGenerator.prototype.docsPostUrl = function(categorySlug) {
    return this.base() + this.docsPostPath(categorySlug);
};

UrlGenerator.prototype.docsPutUrl = function(docSlug) {
    return this.base() + this.docsPutPath(docSlug);
};

UrlGenerator.prototype.docsDeleteUrl = function(docSlug) {
    return this.base() + this.docsDeletePath(docSlug);
};

UrlGenerator.prototype.docCategoriesPostPath = function() {
    return this.docCategoriesPutPath();
};

UrlGenerator.prototype.docCategoriesPutPath = function(slug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/category' + sanitizeSlug(slug);
};

UrlGenerator.prototype.docCategoriesPostUrl = function() {
    return this.base() + this.docCategoriesPostPath();
};

UrlGenerator.prototype.docCategoriesPutUrl = function(slug) {
    return this.base() + this.docCategoriesPutPath(slug);
};

/*
 *  Version
 */

UrlGenerator.prototype.versionsPath = function() {
    return '/api/projects-v/' + this.slug;
};

UrlGenerator.prototype.versionsUrl = function() {
    return this.base() + this.versionsPath();
};

/*
 *  Custom Content
 */

UrlGenerator.prototype.contentPath = function() {
    return '/api/projects/' + this.slug + '/' + this.version;
};

UrlGenerator.prototype.contentUrl = function() {
    return this.base() + this.contentPath();
};

UrlGenerator.prototype.contentPutPath = function() {
    return this.contentPath();
};

UrlGenerator.prototype.contentPutUrl = function() {
    return this.base() + this.contentPutPath();
};

/*
 *  Custom Pages
 */

UrlGenerator.prototype.pagesPath = function(pageSlug) {
    return '/api/projects/' + this.slug + '/' + this.version + '/page' + sanitizeSlug(pageSlug);
};

UrlGenerator.prototype.pagesUrl = function(slug) {
    return this.base() + this.pagesPath(slug);
};

UrlGenerator.prototype.pagesPostPath = function() {
    return this.pagesPath();
};

UrlGenerator.prototype.pagesPutPath = function(slug) {
    return this.pagesPath(slug);
};

UrlGenerator.prototype.pagesDeletePath = function(slug) {
    return this.pagesPath(slug);
};

UrlGenerator.prototype.pagesPostUrl = function() {
    return this.base() + this.pagesPostPath();
};

UrlGenerator.prototype.pagesPutUrl = function(slug) {
    return this.base() + this.pagesPutPath(slug);
};

UrlGenerator.prototype.pagesDeleteUrl = function(slug) {
    return this.base() + this.pagesDeletePath(slug);
};

module.exports = UrlGenerator;
