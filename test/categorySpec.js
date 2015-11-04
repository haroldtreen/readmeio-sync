'use strict';

var assert = require('chai').assert;
var Category = require('../lib/category');

describe('Category', function() {
    var docProperties = { 'title': 'Title', slug: 'slug', excerpt: 'Excerpt', pages: [] };
    it('can accept properties', function() {
        var doc = new Category(docProperties);

        Object.keys(docProperties).forEach(function(key) {
            assert.equal(doc[key], docProperties[key]);
        });
    });

});
