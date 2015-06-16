'use strict';

var request = require('request');
var fs = require('fs');
var _ = require('lodash');

var config = require('./config');
var UrlGenerator = require('./urlGenerator');
var Requestor = require('./requestor');
var ContentExtractor = require('./contentExtractor');

var Initializer = {};

Initializer.configs = config.project;
Initializer.urlGen = new UrlGenerator(Initializer.configs.project);

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
        var urlGenerators = [];

        versions.forEach(function(version) {
            urlGenerators.push(new UrlGenerator(Initializer.configs.project, 'v' + version.version));
        });

        var requestor = new Requestor(cookie, urlGenerators);

        requestor.documentation(function(docsRegistry) {
            requestor.customPages(function(pagesRegistry) {
                requestor.customContent(function(contentRegistry) {
                    var registry = _.merge(docsRegistry, pagesRegistry, contentRegistry);

                    cb(registry);
                });
            });
        });
    };

    var saveRegistry = function(registry, cb) {
        fs.writeFile('syncRegistry.json', JSON.stringify(registry, null, 4), function(err) {
            if (err) {
                throw Error('Error file creating registry file:\n' + err);
            }
            cb(registry);
        });
    };

    this.cookie = cookie;
    fetchVersions(function(versions) {
        buildReadmeContentRegistry(versions, function(registry) {
            var extractor = new ContentExtractor(initPath, registry);

            extractor.all(function(linkedRegistry) {
                saveRegistry(linkedRegistry, initCb);
            });
        });
    });
};

module.exports = Initializer;
