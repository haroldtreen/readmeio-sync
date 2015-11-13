'use strict';

var config = require('./config');
var Requestor = require('./requestor');
var Registry = require('./registry');
var Category = require('./resources/category');
var CustomPage = require('./resources/customPage');
var CustomContent = require('./resources/customContent');
var Version = require('./resources/version');

var toObjectFactory = function(Constructor) {
    var toObject = function(downloadedData) {
        var obj = {};
        Object.keys(downloadedData).forEach(function(version) {
            var resources = downloadedData[version];
            if (Array.isArray(resources)) {
                obj[version] = resources.map(function(resourceData) {
                    return new Constructor(resourceData);
                });
            } else {
                obj[version] = new Constructor(resources);
            }
        });
        return obj;
    };
    return toObject;
};

var Downloader = function(projectName, cookie, options) {
    this.projectName = projectName;
    this.cookie = cookie;
    this.requestor = new Requestor(this.projectName, this.cookie);

    if (options && options.silent) {
        config.progress.logger = function() {};
    }
};

Downloader.downloadFunctions = {
    downloadDocumentation: {
        section: 'documentation',
        requestFn: 'documentation',
        toObject: toObjectFactory(Category)
    },
    downloadCustomPages: {
        section: 'custom pages',
        requestFn: 'customPages',
        toObject: toObjectFactory(CustomPage)
    },
    downloadCustomContent: {
        section: 'custom content',
        requestFn: 'customContent',
        toObject: toObjectFactory(CustomContent)
    }
};

Object.keys(Downloader.downloadFunctions).forEach(function(name) {
    var descriptor = Downloader.downloadFunctions[name];

    Downloader.prototype[name] = function(versions, cb) {
        config.progress.section('Fetching ' + descriptor.section + '...');
        this.requestor[descriptor.requestFn](versions, function(downloadedContent) {
            config.progress.reportResourceResults(descriptor.toObject(downloadedContent));

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
    this.requestor.versions(function(versionData) {
        var versions = versionData.map(function(version) { return new Version(version); });
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
