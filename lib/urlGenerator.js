'use strict';

var js = require('jsonfile');

var UrlGenerator = function(slug, version) {
    this.slug = slug;
    this.version = version;
};

UrlGenerator.base = js.readFileSync('config/project.json').apiBase;

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

module.exports = UrlGenerator;
