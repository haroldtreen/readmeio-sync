'use strict';

var assert = require('chai').assert;

var Version = require('../lib/resources/version');

describe('Version', function() {
    it('has a type', function() {
        var version = new Version({});
        assert.equal(version.getType(), 'version');
    });

    it('has properties', function() {
        var version = new Version({ version: 'v1.0' });
        assert.equal(version.version, 'v1.0');
    });
});
