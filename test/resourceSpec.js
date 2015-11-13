'use strict';

var assert = require('chai').assert;
var Resource = require('../lib/resources/resource');

describe('Resource', function() {

    var VALID_PROPERTIES = ['method', 'version', 'title', 'slug', 'pages'];

    it('can be constructed with no parameters', function() {
        var resource = new Resource();
        assert.isObject(resource);
    });

    it('has toString()', function() {
        var resource = new Resource({ method: 'delete' }, VALID_PROPERTIES);
        assert.equal(resource.toString(), 'DELETE:');

        resource.version = 'v1.0';
        resource.title = 'Title';
        assert.equal(resource.toString(), 'DELETE: v1.0 - Title');

        resource.pages = [];
        assert.equal(resource.toString(), 'DELETE: v1.0 - Title (0 docs)');

        resource.slug = 'slug';
        assert.equal(resource.toString(), 'DELETE: v1.0 - Title <slug> (0 docs)');
    });
});
