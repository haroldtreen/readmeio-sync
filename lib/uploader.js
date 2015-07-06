'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');
var config = require('./config');

var Uploader = function(registry, cookie) {
    this.registry = registry;
    this.cookie = cookie;
    this.downloader = new Downloader(config.projectName, cookie);
};

Uploader.logFailure = function(failedResource) {
    var description = failedResource.title || 'custom content';
    console.error('Failed to upload: ' + description + ' - ' + failedResource.version);
};

Uploader.prototype.uploadDocs = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);

    self.setRequestMethods('allDocCategories', function(allCategories) {
        requestor.uploadDocCategories(allCategories, function(failedCategories) {
            failedCategories.forEach(Uploader.logFailure);

            self.setRequestMethods('allDocs', function(allDocs) {
                requestor.uploadDocs(allDocs, function(failedDocs) {
                    failedDocs.forEach(Uploader.logFailure);

                    cb(self.registry);
                });
            });
        });

    });
};

Uploader.prototype.uploadCustomPages = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);

    self.setRequestMethods('allCustomPages', function(allCustomPages) {
        requestor.uploadPages(allCustomPages, function(failedPages) {
            failedPages.forEach(Uploader.logFailure);
            cb(self.registry);
        });
    });
};

Uploader.prototype.uploadCustomContent = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);
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
                self.uploadDocsOrder(function(orderingErrs) {
                    cb(contentReg);
                });
            });
        });
    });
};

Uploader.prototype.uploadDocsOrder = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);

    requestor.uploadDocCategoriesOrder(self.registry.allDocCategories(), function(categoryErr) {
        requestor.uploadDocsOrder(self.registry.allDocs(), function(docsErr) {
            cb([categoryErr, docsErr]);
        });
    });
};

Uploader.prototype.setRequestMethods = function(section, cb) {
    var self = this;
    self.downloader.downloadRemoteRegistry(function(remoteRegistry) {
        var diff = self.registry.diff(remoteRegistry);

        var resources = self.registry[section]().map(function(resource) {
            resource.method = diff.isAdded(section, { slug: resource.slug, version: resource.version }) ? 'post' : 'put';
            return resource;
        });

        cb(resources);
    });
};

module.exports = Uploader;
