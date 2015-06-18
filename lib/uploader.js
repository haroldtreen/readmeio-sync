'use strict';

var Requestor = require('./requestor');
var configs = require('./config');

var Uploader = function(registry) {
    this.registry = registry;
};

Uploader.logFailure = function(failedResource) {
    console.error('Failed to upload: ' + failedResource.title + ' - ' + failedResource.version);
};

Uploader.prototype.uploadDocs = function(cookie, cb) {
    var self = this;
    var requestor = new Requestor(cookie, configs.project.projectName);
    var allCategories = self.registry.allDocCategories();
    var allDocs = self.registry.allDocs();

    requestor.uploadDocCategories(allCategories, function(failedCategories) {
        failedCategories.forEach(Uploader.logFailure);

        requestor.uploadDocs(allDocs, function(failedDocs) {
            failedDocs.forEach(Uploader.logFailure);
            cb(self.registry);
        });
    });
};

// Uploader.prototype.uploadCustomPages = function(cookie, cb) {
//     var self = this;
//     var requestor = new Requestor(cookie, configs.projectName);
//     var allCustomPages = this.registry.allCustomPages();

//     requestor.uploadPages(allCustomPages, function(failedPages) {
//         failedPages.forEach(Uploader.logFailure);
//         cb(self.registry);
//     });
// };


module.exports = Uploader;
