'use strict';

var Requestor = require('./requestor');
var Registry = require('./registry');
var config = require('./config');

var Downloader = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;
    this.requestor = new Requestor(this.projectName, this.cookie);
};

Downloader.downloadFunctions = {
    downloadDocumentation: { section: 'documentation', requestFn: 'documentation' },
    downloadCustomPages: { section: 'custom pages', requestFn: 'customPages' },
    downloadCustomContent: { section: 'custom content', requestFn: 'customContent' }
};

Object.keys(Downloader.downloadFunctions).forEach(function(name) {
    var descriptor = Downloader.downloadFunctions[name];

    Downloader.prototype[name] = function(versions, cb) {
        config.progress.section('Fetching ' + descriptor.section + '...');
        this.requestor[descriptor.requestFn](versions, function(downloadedContent) {
            config.progress.reportResourceResults(downloadedContent);

            cb(downloadedContent);
        });
    };
});

Downloader.prototype.downloadVersions = function(cb) {
    var self = this;
    if (self.versions) {
        return cb(self.versions);
    }

    config.progress.section('Fetching versions...');
    this.requestor.versions(function(versions) {
        config.progress.reportResourceResults(versions);

        self.versions = versions;
        cb(versions);
    });
};

Downloader.prototype.downloadRemoteRegistry = function(cb) {
    var self = this;
    if (self.remoteRegistry) {
        return cb(self.remoteRegistry);
    }

    config.progress.header('Downloading: ' + this.projectName);
    self.downloadVersions(function(versions) {
        self.downloadDocumentation(versions, function(docsRegistryData) {
            self.downloadCustomPages(versions, function(pagesRegistryData) {
                self.downloadCustomContent(versions, function(contentRegistryData) {
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

module.exports = Downloader;
