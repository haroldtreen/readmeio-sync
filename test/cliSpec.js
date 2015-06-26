'use strict';

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

    var initMock = {
        initProjectInfo: function() {
            initMock.called = true;
        }
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

    it('has an upload command', function() {
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
