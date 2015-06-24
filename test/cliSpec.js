'use strict';

var mockery = require('mockery');
var assert = require('chai').assert;

var Cli;

describe('CLI', function() {
    before(function() {
        mockery.enable();
        mockery.registerAllowable('../lib/cli');
        mockery.registerAllowable('fs');
        mockery.registerAllowable('jsonfile');
    });
    after(function() {
        mockery.disable();
    });

    it('has an upload command', function() {
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

        mockery.registerMock('./authenticator', authMock);
        mockery.registerMock('./uploader', uploadMock);
        mockery.registerMock('./registry', registryMock);

        Cli = require('../lib/cli');

        Cli.upload('options');

        assert.isTrue(authMock.called, 'Authentication didn\'t occur');
        assert.isTrue(uploadMock.called, 'Upload didn\'t occur');
        assert.isTrue(registryMock.importCalled, 'Registry import didn\'t occur');
    });
});
