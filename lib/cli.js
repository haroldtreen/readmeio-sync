'use strict';

var js = require('jsonfile');
var fs = require('fs');

var RegistryBuilder = require('./registryBuilder');
var Uploader = require('./uploader');
var Authenticator = require('./authenticator');
var Initializer = require('./initializer');
var Cleaner = require('./cleaner');
var config = require('./config');

var Cli = {};

var setProjectName = function(production) {
    var isProd = !!production;
    var env = isProd ? 'production' : 'staging';

    process.env.PRODUCTION = isProd;
    config.projectName = config.projectNames[env];
};

Cli.upload = function(options) {
    setProjectName(options.production);

    Authenticator.createSession(function(cookie) {
        var registry = RegistryBuilder.build(js.readFileSync(config.syncSettingsPath));
        registry.projectName = config.projectName;

        var uploader = new Uploader(registry, cookie);

        uploader.uploadAll(function(uploadedRegistry) {
            uploadedRegistry.save('./');
        });
    });
};

Cli.init = function() {
    Authenticator.createSession(function(cookie) {
        var initializer = new Initializer(cookie);
        initializer.initProjectInfo('./', function(initializedReg) {
            console.log(initializedReg.projectName + ' initialization complete!');
        });
    });
};

Cli.clean = function(options) {
    setProjectName(options.production);

    Authenticator.createSession(function(cookie) {
        var registry = RegistryBuilder.build(js.readFileSync(config.syncSettingsPath));
        registry.projectName = config.projectName;

        var cleaner = new Cleaner(registry, cookie, options);
        cleaner.cleanAll(function(allDeleted) {
            console.log('Clean Complete! (' + allDeleted.length + ' items removed)');
        });
    });
};

Cli.config = function(options) {
    var syncConfigs;

    if (fs.existsSync(config.path)) {
        syncConfigs = js.readFileSync(config.path);
        syncConfigs.projectNames = syncConfigs.projectNames || {};
    } else {
        syncConfigs = { projectNames: { staging: '<staging-slug>', production: '<production-slug>' }};
    }

    if (options.staging) {
        syncConfigs.projectNames.staging = options.staging;
    }

    if (options.production) {
        syncConfigs.projectNames.production = options.production;
    }
    fs.writeFileSync(config.path, JSON.stringify(syncConfigs, null, 4));
};

module.exports = Cli;
