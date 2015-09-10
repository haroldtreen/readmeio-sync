'use strict';

var Downloader = require('./downloader');
var Requestor = require('./requestor');

var config = require('./config');

var Cleaner = function(registry, cookie) {
    this.localRegistry = registry;
    this.cookie = cookie;
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

Cleaner.prototype.cleanDocs = function(cb) {
    var self = this;
    var downloader = new Downloader(config.projectName, self.cookie);
    downloader.versions = self.localRegistry.versions.map(function(version) { return { version: version }; });

    downloader.downloadRemoteRegistry(function(remoteRegistry) {
        var deletedDocs = self.localRegistry.diff(remoteRegistry).deleted.allDocs;
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
    var downloader = new Downloader(config.projectName, self.cookie);
    downloader.versions = self.localRegistry.versions.map(function(version) { return { version: version }; });

    downloader.downloadRemoteRegistry(function(remoteRegistry) {
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
    var downloader = new Downloader(config.projectName, self.cookie);
    downloader.versions = self.localRegistry.versions.map(function(version) { return { version: version }; });

    downloader.downloadRemoteRegistry(function(remoteRegistry) {
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
