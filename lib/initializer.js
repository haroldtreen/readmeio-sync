'use strict';

var config = require('./config');
var Downloader = require('./downloader');
var ContentExtractor = require('./contentExtractor');

var Initializer = function(cookie) {
    this.cookie = cookie;
    this.projectName = config.projectNames.production;
};

Initializer.prototype.initProjectInfo = function(initPath, initCb) {
    var downloader = new Downloader(this.projectName, this.cookie);

    downloader.downloadRemoteRegistry(function(remoteRegistry) {
        var extractor = new ContentExtractor(initPath, remoteRegistry);

        extractor.all(function(linkedRegistry) {
            linkedRegistry.save(initPath);
            initCb(linkedRegistry);
        });
    });
};

module.exports = Initializer;
