'use strict';

var request = require('request');
var fs = require('fs');
var _ = require('lodash');

var config = require('./config');
var UrlGenerator = require('./urlGenerator');
var Requestor = require('./requestor');
var Registry = require('./registry');
var ContentExtractor = require('./contentExtractor');

var Initializer = {};

Initializer.urlGen = new UrlGenerator(config.projectNames.production);

Initializer.initProjectInfo = function(initPath, cookie, initCb) {
    /*
        Downloads the version data for the project
    */
    var fetchVersions = function(cb) {
        request.get({ url: Initializer.urlGen.versionsUrl(), jar: Initializer.cookie }, function(err, response, body) {
            if (err) {
                throw new Error('Versions could not be downloaded:\n' + err);
            } else {
                cb(JSON.parse(body));
            }
        });
    };

    /*
        Downloads documentation, custom pages and custom content and saves to a registry file.
    */
    var buildReadmeContentRegistry = function(versions, cb) {
        var resources = versions.map(function(version) {
            return { version: 'v' + version.version };
        });

        var requestor = new Requestor(cookie, config.projectNames.production);

        requestor.documentation(resources, function(docsRegistryData) {
            requestor.customPages(resources, function(pagesRegistryData) {
                requestor.customContent(resources, function(contentRegistryData) {
                    var registryData = _.merge(docsRegistryData, pagesRegistryData, contentRegistryData);

                    var registry = new Registry();
                    registry.import(registryData);

                    cb(registry);
                });
            });
        });
    };

    this.cookie = cookie;
    fetchVersions(function(versions) {
        buildReadmeContentRegistry(versions, function(registry) {
            var extractor = new ContentExtractor(initPath, registry);

            extractor.all(function(linkedRegistry) {
                linkedRegistry.save(initPath);
                initCb(linkedRegistry);
            });
        });
    });
};

module.exports = Initializer;
