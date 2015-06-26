'use strict';

var js = require('jsonfile');

var Registry = require('./registry');
var Uploader = require('./uploader');
var Authenticator = require('./authenticator');
var Initializer = require('./initializer');

var Cli = {};

Cli.upload = function(options) {
    if (options.production) {
        process.env.PRODUCTION = true;
    }

    Authenticator.createSession(function(cookie) {
        var registry = new Registry();
        registry.import(js.readFileSync('syncRegistry.json'));

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

module.exports = Cli;
