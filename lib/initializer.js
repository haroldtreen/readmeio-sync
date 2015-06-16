'use strict';

var request = require('request');
var fs = require('fs');
var _ = require('lodash');

var config = require('./config');
var UrlGenerator = require('./urlGenerator');
var Requestor = require('./requestor');

var Initializer = {};

Initializer.configs = config.project;
Initializer.urlGen = new UrlGenerator(Initializer.configs.project);

/*
    Downloads documentation, custom pages and custom content and saves to a registry file.
*/
var createProjectRegistry = function(versions, cb) {
    var urlGenerators = [];

    versions.forEach(function(version) {
        urlGenerators.push(new UrlGenerator(Initializer.configs.project, 'v' + version.version));
    });

    var requestor = new Requestor(Initializer.cookie, urlGenerators);

    requestor.documentation(function(docsRegistry) {
        requestor.customPages(function(pagesRegistry) {
            requestor.customContent(function(contentRegistry) {
                var registry = _.merge(docsRegistry, pagesRegistry, contentRegistry);

                fs.writeFile('syncRegistry.json', JSON.stringify(registry, null, 4), function(err) {
                    if (err) {
                        throw Error('Error file creating registry file:\n' + err);
                    }
                    cb(registry);
                });
            });
        });
    });
};

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

Initializer.initProjectInfo = function(cookie, cb) {
    this.cookie = cookie;
    fetchVersions(function(versions) {
        createProjectRegistry(versions, cb);
    });
};

module.exports = Initializer;
