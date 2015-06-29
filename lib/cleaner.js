'use strict';

var Initializer = require('./initializer');
var Requestor = require('./requestor');
var config = require('./config');

var Cleaner = function(registry, cookie) {
    this.localRegistry = registry;
    this.cookie = cookie;
};

Cleaner.prototype.cleanDocs = function(cb) {
    var self = this;

    this.buildRemoteRegistry(function(remoteRegistry) {
        var diff = self.localRegistry.diff(remoteRegistry);
        var requestor = new Requestor(self.cookie, config.projectName);

        requestor.deleteDocs(diff.deleted.allDocs, function(failedDeletes) {
            cb(failedDeletes);
        });
    });
};

Cleaner.prototype.cleanPages = function(cb) {
    var self = this;

    this.buildRemoteRegistry(function(remoteRegistry) {
        var diff = self.localRegistry.diff(remoteRegistry);
        var requestor = new Requestor(self.cookie, config.projectName);

        requestor.deletePages(diff.deleted.allCustomPages, function(failedDeletes) {
            cb(failedDeletes);
        });
    });
};

Cleaner.prototype.buildRemoteRegistry = function(cb) {
    var self = this;
    if (self.remoteRegistry) {
        cb(self.remoteRegistry);
    } else {
        var initializer = new Initializer(this.cookie);
        var versions = this.localRegistry.versions.map(function(version) { return { version: version }; });

        initializer.buildReadmeContentRegistry(versions, function(remoteRegistry) {
            self.remoteRegistry = remoteRegistry;
            cb(remoteRegistry);
        });
    }
};

module.exports = Cleaner;
