'use strict';

var js = require('jsonfile');
var mockery = require('mockery');
var assert = require('chai').assert;

var Cli;

describe('CLI', function() {
    beforeEach(function() {
        mockery.enable({
            warnOnUnregistered: false,
            warnOnReplace: false,
            useCleanCache: true
        });
    });
    afterEach(function() {
        mockery.disable();
    });

    var initMock = function() {};
    initMock.prototype.initProjectInfo = function() {
        initMock.called = true;
    };

    var authMock = {
        createSession: function(cb) {
            authMock.called = true;
            cb();
        }
    };

    var uploadMock = function() {};
    uploadMock.prototype.uploadAll = function() {
        uploadMock.called = true;
    };

    var registryMock = function() {};
    registryMock.prototype.import = function() {
        registryMock.importCalled = true;
    };

    describe('upload', function() {
        it('authenticates and uploads all', function() {
            authMock.called = false;
            uploadMock.called = false;
            registryMock.importCalled = false;

            mockery.registerMock('./authenticator', authMock);
            mockery.registerMock('./uploader', uploadMock);
            mockery.registerMock('./registry', registryMock);

            Cli = require('../lib/cli');

            Cli.upload('options');

            assert.isTrue(authMock.called, 'Authentication didn\'t occur');
            assert.isTrue(uploadMock.called, 'Upload didn\'t occur');
            assert.isTrue(registryMock.importCalled, 'Registry import didn\'t occur');
        });

        it('can accept a production flag', function() {
            var config = require('../lib/config');
            mockery.registerMock('./authenticator', { createSession: function(){} });
            
            Cli = require('../lib/cli');

            Cli.upload({ production: true });
            assert.equal(config.projectName, config.projectNames.production);

            Cli.upload({ production: false });
            assert.equal(config.projectName, config.projectNames.staging);
        });
    });

    describe('config command', function(){
        it('allows you to generate a config file', function() {
            Cli = require('../lib/cli');
            Cli.config({ production: 'github-upload-production', staging: 'github-upload-staging'});

            var configPath = __dirname + '/fixtures/syncConfig.json';
            var config = js.readFileSync(configPath);

            assert.equal(config.projectNames.production, 'github-upload-production');
            assert.equal(config.projectNames.staging, 'github-upload-staging');

            js.writeFileSync(configPath, {
                projectNames: {
                    production: 'github-upload',
                    staging: 'github-upload'
                }
            });
        });
    });

    it('has an init command', function() {
        authMock.called = false;
        initMock.called = false;

        mockery.registerMock('./authenticator', authMock);
        mockery.registerMock('./initializer', initMock);

        Cli = require('../lib/cli');

        Cli.init();

        assert.isTrue(authMock.called, 'Authentication didn\'t occur');
        assert.isTrue(initMock.called, 'Init didn\'t occur');
    });

});
