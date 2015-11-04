'use strict';

var assert = require('chai').assert;
var CustomPage = require('../lib/customPage');

describe('Custom Page', function() {
    var pageProperties = { 'title': 'Title', html: '<html></html>', slug: 'slug' };
    it('can accept properties', function() {
        var doc = new CustomPage(pageProperties);

        Object.keys(pageProperties).forEach(function(key) {
            assert.equal(doc[key], pageProperties[key]);
        });
    });

    it('can filter valid page files', function() {
        var filenames = ['file1.png', 'file2.md', 'file3.html'];
        var valid = CustomPage.filterValidFiles(filenames);

        assert.deepEqual(valid, ['file3.html']);
    });

    it('can be generated from a filename', function() {
        var customPage = CustomPage.fromFilepath('Custom Page.html');
        assert.equal(customPage.title, 'Custom Page');
        assert.equal(customPage.slug, 'custom-page');
        assert.equal(customPage.html, 'Custom Page.html');

        customPage = CustomPage.fromFilepath('/Users/johndoe/Second Custom Page.html');
        assert.equal(customPage.title, 'Second Custom Page');
        assert.equal(customPage.slug, 'second-custom-page');
        assert.equal(customPage.html, '/Users/johndoe/Second Custom Page.html');
    });

});
