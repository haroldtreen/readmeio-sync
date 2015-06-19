#! /usr/bin/env node

'use strict';

var js = require('jsonfile');

var authenticator = require('./lib/authenticator');
var Initializer = require('./lib/initializer');
var Registry = require('./lib/registry');
var Uploader = require('./lib/uploader');


authenticator.createSession(function(cookie) {
    if (process.argv[2] === 'upload') {
        console.log('Upload!');
        var registry = new Registry();
        registry.import(js.readFileSync('syncRegistry.json'));

        var uploader = new Uploader(registry);
        uploader.uploadDocs(cookie, function(uploadedRegistry) {
            uploadedRegistry.save('./');
        });
    } else if (process.argv[2] === 'init') {
        console.log('Init!');
        Initializer.initProjectInfo('./', cookie, function(initRepository) {
            console.log('Done!');
        });
    }
});
