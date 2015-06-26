'use strict';

var assert = require('chai').assert;
var config = require('../lib/config');

describe('SyncConfig', function() {

    it('pulls in configs from json', function() {
        assert.equal(Object.keys(config).length, 5);
    });
});
