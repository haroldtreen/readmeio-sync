'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');

var config = require('./config');

var Cleaner = function(registry, cookie, options) {
    this.localRegistry = registry;
    this.cookie = cookie;
    this.options = options;
    this.requestor = new Requestor(config.projectName, this.cookie);
};

Cleaner.prototype.getRemoteRegistry = function(cb) {
    var downloader = new Downloader(config.projectName, this.cookie);
    downloader.versions = this.localRegistry.versions.map(function(version) { return { version: version }; });

    config.progress.logger = function() {}; // Silent download
    downloader.downloadRemoteRegistry(function(remoteRegistry) {
        config.progress.logger = config.log;
        cb(remoteRegistry);
    });

    return downloader;
};

Cleaner.prototype.cleanDocs = function(cb) {
    var self = this;

    this.getRemoteRegistry(function(remoteRegistry) {
        var diff = self.localRegistry.diff(remoteRegistry);
        var deletedDocs = diff.deleted.allDocs;

        if (self.options && self.options.aggressive) {
            deletedDocs = deletedDocs.concat(diff.added.allDocs);
        }

        config.progress.section('Deleting documents...');
        self.requestor.deleteDocs(deletedDocs, function(docResults) {
            config.progress.reportResourceResults(docResults);

            cb(docResults);
        });
    });
};

Cleaner.prototype.cleanDocCategories = function(cb) {
    var self = this;

    this.getRemoteRegistry(function(remoteRegistry) {
        var deletedCategories = self.localRegistry.diff(remoteRegistry).deleted.allDocCategories;

        config.progress.section('Deleting document categories...');
        self.requestor.deleteDocCategories(deletedCategories, function(categoryResults) {
            config.progress.reportResourceResults(categoryResults);

            cb(categoryResults);
        });
    });
};

Cleaner.prototype.cleanPages = function(cb) {
    var self = this;

    this.getRemoteRegistry(function(remoteRegistry) {
        var deletedPages = self.localRegistry.diff(remoteRegistry).deleted.allCustomPages;

        config.progress.section('Deleting custom pages...');
        self.requestor.deletePages(deletedPages, function(pageResults) {
            config.progress.reportResourceResults(pageResults);

            cb(pageResults);
        });
    });
};

Cleaner.prototype.cleanAll = function(cb) {
    var self = this;
    config.progress.header('Cleaning: ' + config.projectName);
    self.cleanDocs(function(deletedDocs) {
        self.cleanDocCategories(function(deletedCategories) {
            self.cleanPages(function(deletedPages) {
                var deletedResources = deletedDocs.concat(deletedCategories, deletedPages);
                cb(deletedResources);
            });
        });
    });
};

module.exports = Cleaner;
