'use strict';

var js = require('jsonfile');
var fs = require('fs');

if(process.argv[2] !== 'config') {
    var Registry = require('./registry');
    var Uploader = require('./uploader');
    var Authenticator = require('./authenticator');
    var Initializer = require('./initializer');
    var config = require('./config');
}

var Cli = {};

Cli.upload = function(options) {
    if (options.production) {
        process.env.PRODUCTION = 'true';
        config.projectName = config.projectNames.production;
    }

    Authenticator.createSession(function(cookie) {
        var registry = new Registry();
        registry.import(js.readFileSync('syncRegistry.json'));
        registry.projectName = config.projectName;

        var uploader = new Uploader(registry);

        uploader.uploadAll(cookie, function(uploadedRegistry) {
            uploadedRegistry.save('./');
        });
    });
};

Cli.init = function() {
    Authenticator.createSession(function(cookie) {
        Initializer.initProjectInfo('./', cookie, function(initializedReg) {
            console.log(initializedReg.projectName + ' initialization complete!');
        });
    });
};

Cli.config = function(options) {
    var syncConfigs;
    var configPath = process.env.TEST_MODE !== 'true' ? 'syncConfig.json' : 'test/fixtures/syncConfig.json';

    if (fs.existsSync(configPath)) {
        syncConfigs = js.readFileSync(configPath);
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
    fs.writeFileSync(configPath, JSON.stringify(syncConfigs, null, 4));
};

module.exports = Cli;
