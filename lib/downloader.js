'use strict';

var Requestor = require('./requestor');
var Registry = require('./registry');
var config = require('./config');

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

    config.progress.header('Downloading: ' + this.projectName);

    config.progress.section('Fetching versions...');
    self.downloadVersions(function(versions) {
        config.progress.reportResourceResults(versions);

        config.progress.section('Fetching documentation...');
        requestor.documentation(versions, function(docsRegistryData) {
            config.progress.reportResourceResults(docsRegistryData);

            config.progress.section('Fetching custom pages...');
            requestor.customPages(versions, function(pagesRegistryData) {
                config.progress.reportResourceResults(pagesRegistryData);

                config.progress.section('Fetching custom content...');
                requestor.customContent(versions, function(contentRegistryData) {
                    config.progress.reportResourceResults(contentRegistryData);

                    var registryData = {};
                    var project = registryData[self.projectName] = {};

                    Object.keys(docsRegistryData).forEach(function(version) {
                        project[version] = {
                            documentation: docsRegistryData[version],
                            customPages: pagesRegistryData[version],
                            customContent: contentRegistryData[version]
                        };
                    });

                    self.remoteRegistry = new Registry(registryData);
                    cb(self.remoteRegistry);
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
