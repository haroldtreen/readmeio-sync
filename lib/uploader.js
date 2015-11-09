'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');
var config = require('./config');

var Uploader = function(registry, cookie) {
    this.registry = registry;
    this.cookie = cookie;
    this.downloader = new Downloader(config.projectName, cookie);
};

Uploader.prototype.uploadDocs = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);

    self.setRequestMethods('allDocCategories', function(allCategories) {
        config.progress.section('Creating documentation categories...');
        requestor.uploadDocCategories(allCategories, function(uploadedCategories) {
            config.progress.reportResourceResults(uploadedCategories);

            self.setRequestMethods('allDocs', function(allDocs) {
                config.progress.section('Creating documents...');
                requestor.uploadDocs(allDocs, function(uploadedDocs) {
                    config.progress.reportResourceResults(uploadedDocs);

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
        config.progress.section('Creating custom pages...');
        requestor.uploadPages(allCustomPages, function(uploadedPages) {
            config.progress.reportResourceResults(uploadedPages);

            cb(self.registry);
        });
    });
};

Uploader.prototype.uploadCustomContent = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);
    var allCustomContent = this.registry.allCustomContent();

    requestor.uploadContent(allCustomContent, function(uploadedContent) {
        config.progress.reportResourceResults(uploadedContent);
        cb(self.registry);
    });
};

Uploader.prototype.uploadAll = function(cb) {
    var self = this;
    config.progress.header('Uploading to: ' + this.registry.projectName);
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
