'use strict';

var Downloader = require('../../lib/downloader');
var registryFactory = require('../factories/registryFactory');
var SpyHelpers = require('../helpers/mockHelpers');

var DownloaderMock = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;
};

DownloaderMock.prototype = Object.create(Downloader.prototype);

DownloaderMock.prototype.downloadRemoteRegistry = function(cb) {
    cb(registryFactory());
};

DownloaderMock = SpyHelpers.spyOnPrototype(DownloaderMock);

module.exports = DownloaderMock;
