'use strict';

var fs = require('fs');
var assert = require('chai').assert;
var auth = require('../lib/authenticator');

describe('Authenticator', function() {
    it('should return a cookie', function(done) {
        auth.createSession(function(cookie) {
            assert(cookie._jar.store.idx['dash.readme.io'], 'Cookie was not returned');
            done();
        });
    });

    it('should load settings from a json', function() {
        var authJson = fs.readFileSync('config/auth.json');
        var authConfigs = JSON.parse(authJson);

        Object.keys(authConfigs).forEach(function(key) {
            assert.equal(auth.configs[key], authConfigs[key]);
        });
    });
});
