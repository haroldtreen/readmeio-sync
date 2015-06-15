'use strict';

var assert = require('chai').assert;
var config = require('../lib/config');

describe('SyncConfig', function() {

    it('pulls in configs for each json', function() {
        var keys = Object.keys(config);

        assert.equal(Object.keys(config).length, 2);
        assert.equal(keys[0], 'auth');
        assert.equal(keys[1], 'project');
    });
});
