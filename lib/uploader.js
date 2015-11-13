'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');
var config = require('./config');

var Category = require('./resources/category');

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
        requestor.uploadDocCategories(allCategories, function(categoriesData) {
            var categories = categoriesData.map(function(data) { return new Category(data); });
            config.progress.reportResourceResults(categories);

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

    config.progress.section('Creating custom content...');
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
                self.uploadDocsOrder(function(orderingSuccess) {
                    if (orderingSuccess) {
                        cb(contentReg);
                    } else {
                        config.log('Ordering documentation failed :(');
                    }
                });
            });
        });
    });
};

Uploader.prototype.uploadDocsOrder = function(cb) {
    var self = this;
    var requestor = new Requestor(config.projectName, self.cookie);

    config.progress.section('Setting category orders...');
    requestor.uploadDocCategoriesOrder(self.registry.allDocCategories(), function(categoryResults) {
        config.progress.reportResourceResults(categoryResults);

        config.progress.section('Setting document orders...');
        requestor.uploadDocsOrder(self.registry.allDocs(), function(docsResults) {
            config.progress.reportResourceResults(docsResults);

            cb(!!docsResults && !!categoryResults);
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
