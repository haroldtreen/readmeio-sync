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
        config.progress.section('Documentation Categories');
        requestor.uploadDocCategories(allCategories, function(failedCategories) {
            config.progress.failures(failedCategories, function(category) {
                return category.title + ' (' + category.version + ')';
            });

            self.setRequestMethods('allDocs', function(allDocs) {
                config.progress.section('Documentation');
                requestor.uploadDocs(allDocs, function(failedDocs) {
                    config.progress.failures(failedDocs, function(doc) {
                        return doc.title + ' (' + doc.version + ')';
                    });

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
        config.progress.section('Custom Pages');
        requestor.uploadPages(allCustomPages, function(failedPages) {
            config.progress.failures(failedPages, function(page) {
                return page.title + ' (' + page.version + ')';
            });
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
    config.progress.section('Uploading All:');
    self.uploadDocs(function() {
        self.uploadCustomPages(function() {
            self.uploadCustomContent(function(contentReg) {
                self.uploadDocsOrder(function(orderingErrs) {
                    if (orderingErrs[0]) {
                        config.log('Category ordering failed:', orderingErrs[0]);
                    }
                    if(orderingErrs[1]) {
                        config.log('Docs ordering failed:', orderingErrs[1]);
                    }
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
