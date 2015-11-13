'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');

var config = require('./config');

var Cleaner = function(registry, cookie, options) {
    this.localRegistry = registry;
    this.cookie = cookie;
    this.options = options;
};

Cleaner.logFailure = function(resource) {
    console.log('Failed to delete ' + JSON.stringify(resource));
};

Cleaner.filterFailures = function(allResources, failedResources) {
    var success = allResources.filter(function(resource) {
        return failedResources.indexOf(resource) < 0;
    });

    return success;
};

Cleaner.prototype.buildDownloader = function() {
    var downloader = new Downloader(config.projectName, this.cookie, { silent: true });
    downloader.versions = this.localRegistry.versions.map(function(version) { return { version: version }; });

    return downloader;
};

Cleaner.prototype.cleanDocs = function(cb) {
    var self = this;

    this.buildDownloader().downloadRemoteRegistry(function(remoteRegistry) {
        var diff = self.localRegistry.diff(remoteRegistry);
        var deletedDocs = diff.deleted.allDocs;

        if (self.options && self.options.aggressive) {
            deletedDocs = deletedDocs.concat(diff.added.allDocs);
        }

        var requestor = new Requestor(config.projectName, self.cookie);

        requestor.deleteDocs(deletedDocs, function(failedDeletes) {
            failedDeletes.forEach(Cleaner.logFailure);

            var successfulDeletes = Cleaner.filterFailures(deletedDocs, failedDeletes);
            cb(successfulDeletes);
        });
    });
};

Cleaner.prototype.cleanDocCategories = function(cb) {
    var self = this;

    this.buildDownloader().downloadRemoteRegistry(function(remoteRegistry) {
        var deletedCategories = self.localRegistry.diff(remoteRegistry).deleted.allDocCategories;
        var requestor = new Requestor(config.projectName, self.cookie);

        requestor.deleteDocCategories(deletedCategories, function(failedDeletes) {
            failedDeletes.forEach(Cleaner.logFailure);

            var successfulDeletes = Cleaner.filterFailures(deletedCategories, failedDeletes);
            cb(successfulDeletes);
        });
    });
};

Cleaner.prototype.cleanPages = function(cb) {
    var self = this;

    this.buildDownloader().downloadRemoteRegistry(function(remoteRegistry) {
        var deletedPages = self.localRegistry.diff(remoteRegistry).deleted.allCustomPages;
        var requestor = new Requestor(config.projectName, self.cookie);

        requestor.deletePages(deletedPages, function(failedDeletes) {
            failedDeletes.forEach(Cleaner.logFailure);

            var successfulDeletes = Cleaner.filterFailures(deletedPages, failedDeletes);
            cb(successfulDeletes);
        });
    });
};

Cleaner.prototype.cleanAll = function(cb) {
    var self = this;
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
