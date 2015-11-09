'use strict';

var assert = require('chai').assert;
var path = require('path');
var Category = require('../lib/resources/category');

describe('Category', function() {
    var docProperties = { 'title': 'Title', slug: 'slug', excerpt: 'Excerpt', pages: [] };
    it('can accept properties', function() {
        var doc = new Category(docProperties);

        Object.keys(docProperties).forEach(function(key) {
            assert.equal(doc[key], docProperties[key]);
        });
    });

    it('can be built from a path', function() {
        var categoryPath = 'test/fixtures/project-fixture/v1.0/documentation/1-Category 1';
        [
            Category.fromFilepath(categoryPath),
            Category.fromFilepath(path.basename(categoryPath))
        ].forEach(function(category) {
            assert.equal(category.title, 'Category 1');
            assert.equal(category.order, 1);
            assert.equal(category.slug, 'category-1');
        });

    });

});
