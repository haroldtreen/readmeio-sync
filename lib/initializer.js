'use strict';

var _ = require('lodash');

var config = require('./config');
var Requestor = require('./requestor');
var Registry = require('./registry');
var ContentExtractor = require('./contentExtractor');

var Initializer = function(cookie) {
    this.cookie = cookie;
    this.projectName = config.projectNames.production;
};

Initializer.prototype.initProjectInfo = function(initPath, initCb) {
    var self = this;
    var requestor = new Requestor(this.cookie, this.projectName);

    requestor.versions(function(versions) {
        self.buildReadmeContentRegistry(versions, function(registry) {
            var extractor = new ContentExtractor(initPath, registry);

            extractor.all(function(linkedRegistry) {
                linkedRegistry.save(initPath);
                initCb(linkedRegistry);
            });
        });
    });
};

/*
    Downloads documentation, custom pages and custom content and saves to a registry file.
*/
Initializer.prototype.buildReadmeContentRegistry = function(versions, cb) {
    var requestor = new Requestor(this.cookie, this.projectName);

    requestor.documentation(versions, function(docsRegistryData) {
        requestor.customPages(versions, function(pagesRegistryData) {
            requestor.customContent(versions, function(contentRegistryData) {
                var registryData = _.merge(docsRegistryData, pagesRegistryData, contentRegistryData);
                var registry = new Registry(registryData);

                cb(registry);
            });
        });
    });
};

module.exports = Initializer;
