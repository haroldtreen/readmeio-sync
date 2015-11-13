'use strict';

var assert = require('chai').assert;
var path = require('path');
var Category = require('../lib/resources/category');

describe('Category', function() {
    var categoryProperties = { title: 'Title', slug: 'slug', pages: [] };
    it('can accept properties', function() {
        var category = new Category(categoryProperties);

        Object.keys(categoryProperties).forEach(function(key) {
            assert.deepEqual(category[key], categoryProperties[key]);
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

    it('has a type', function() {
        assert.equal(new Category({}).getType(), 'category');
    });

    it('has a toString()', function() {
        var category = new Category(categoryProperties);

        assert.equal(category.toString(), 'Title <slug> (0 docs)');

        category.version = 'v1.0';
        assert.equal(category.toString(), 'v1.0 - Title <slug> (0 docs)');

        category.method = 'delete';
        assert.equal(category.toString(), 'DELETE: v1.0 - Title <slug> (0 docs)');
    });

});
