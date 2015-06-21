'use strict';

var Requestor = require('./requestor');
var config = require('./config');

var Uploader = function(registry) {
    this.registry = registry;
};

Uploader.logFailure = function(failedResource) {
    console.error('Failed to upload: ' + failedResource.title + ' - ' + failedResource.version);
};

Uploader.prototype.uploadDocs = function(cookie, cb) {
    var self = this;
    var requestor = new Requestor(cookie, config.projectName);

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

Uploader.prototype.uploadCustomPages = function(cookie, cb) {
    var self = this;
    var requestor = new Requestor(cookie, config.projectName);
    var allCustomPages = this.registry.allCustomPages();

    requestor.uploadPages(allCustomPages, function(failedPages) {
        failedPages.forEach(Uploader.logFailure);
        cb(self.registry);
    });
};


module.exports = Uploader;
