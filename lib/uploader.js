'use strict';

var Requestor = require('./requestor');
var config = require('./config');

var Uploader = function(registry, cookie) {
    this.registry = registry;
    this.cookie = cookie;
};

Uploader.logFailure = function(failedResource) {
    var description = failedResource.title || 'custom content';
    console.error('Failed to upload: ' + description + ' - ' + failedResource.version);
};

Uploader.prototype.uploadDocs = function(cb) {
    var self = this;
    var requestor = new Requestor(self.cookie, config.projectName);

    var allCategories = self.registry.allDocCategories();
    requestor.uploadDocCategories(allCategories, function(failedCategories) {
        failedCategories.forEach(Uploader.logFailure);

        var allDocs = self.registry.allDocs();
        requestor.uploadDocs(allDocs, function(failedDocs) {
            failedDocs.forEach(Uploader.logFailure);
            cb(self.registry);
        });
    });
};

Uploader.prototype.uploadCustomPages = function(cb) {
    var self = this;
    var requestor = new Requestor(self.cookie, config.projectName);
    var allCustomPages = this.registry.allCustomPages();

    requestor.uploadPages(allCustomPages, function(failedPages) {
        failedPages.forEach(Uploader.logFailure);
        cb(self.registry);
    });
};

Uploader.prototype.uploadCustomContent = function(cb) {
    var self = this;
    var requestor = new Requestor(self.cookie, config.projectName);
    var allCustomContent = this.registry.allCustomContent();

    requestor.uploadContent(allCustomContent, function(failedContent) {
        failedContent.forEach(Uploader.logFailure);
        cb(self.registry);
    });
};

Uploader.prototype.uploadAll = function(cb) {
    var self = this;
    self.uploadDocs(function() {
        self.uploadCustomPages(function() {
            self.uploadCustomContent(function(contentReg) {
                cb(contentReg);
            });
        });
    });
};

module.exports = Uploader;
