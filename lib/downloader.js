'use strict';

var _ = require('lodash');

var Requestor = require('./requestor');
var Registry = require('./registry');

var Downloader = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;
};

Downloader.prototype.downloadRemoteRegistry = function(cb) {
    var self = this;
    var requestor = new Requestor(self.projectName, self.cookie);

    if (self.remoteRegistry) {
        return cb(self.remoteRegistry);
    }

    self.downloadVersions(function(versions) {
        requestor.documentation(versions, function(docsRegistryData) {
            requestor.customPages(versions, function(pagesRegistryData) {
                requestor.customContent(versions, function(contentRegistryData) {
                    var registryData = _.merge(docsRegistryData, pagesRegistryData, contentRegistryData);
                    var registry = new Registry(registryData);
                    self.remoteRegistry = registry;

                    cb(registry);
                });
            });
        });
    });
};

Downloader.prototype.downloadVersions = function(cb) {
    var self = this;
    var requestor = new Requestor(self.projectName, self.cookie);

    if (self.versions) {
        return cb(self.versions);
    }

    requestor.versions(function(versions) {
        self.versions = versions;
        cb(versions);
    });
};

module.exports = Downloader;
