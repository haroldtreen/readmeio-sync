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
});
