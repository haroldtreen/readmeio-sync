'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var RequestorFilters = require('../lib/requestorFilters');

var documentationGet = js.readFileSync('test/fixtures/docs-v1.json');
var customPageGet = js.readFileSync('test/fixtures/pages-v1.json');
var customContentGet = js.readFileSync('test/fixtures/content-v1.json');

describe('Requestor Filters', function() {
    it('transform data', function() {
        var whitelist = { hi: 'bye', yes: 'no' };
        var input = { bye: 'byeValue', no: 'noValue' };
        var transformed = RequestorFilters.transform(whitelist, input);

        assert.equal(transformed.hi, 'byeValue');
        assert.equal(transformed.yes, 'noValue');
    });

    it('documentation', function() {
        var docs = documentationGet;
        var filteredDocumentation = RequestorFilters.documentation(docs);

        filteredDocumentation.forEach(function(category) {
            assert.includeMembers(Object.keys(category), Object.keys(RequestorFilters.docCategoryWhitelist));
            category.pages.forEach(function(doc) {
                assert.includeMembers(Object.keys(doc), Object.keys(RequestorFilters.docWhitelist));
            });
        });
    });

    it('doc data', function() {
        var doc = documentationGet[0].pages[0];
        doc.excerpt = 'hello\n';
        var filteredPage = RequestorFilters.doc(doc);

        Object.keys(filteredPage).forEach(function(key) {
            assert.notInclude(filteredPage.excerpt, '\n');
            assert.property(RequestorFilters.docWhitelist, key);
        });
    });

    it('category data', function() {
        var category = documentationGet[0];
        var filteredCategory = RequestorFilters.category(category);

        Object.keys(filteredCategory).forEach(function(key) {
            assert.property(RequestorFilters.docCategoryWhitelist, key);
        });

        filteredCategory.pages.forEach(function(page) {
            Object.keys(page).forEach(function(key) {
                assert.property(RequestorFilters.docWhitelist, key);
            });
        });
    });

    it('custom page', function() {
        var customPage = customPageGet[0];
        var filteredCustomPage = RequestorFilters.page(customPage);

        Object.keys(filteredCustomPage).forEach(function(key) {
            assert.property(RequestorFilters.pageWhitelist, key);
        });
    });

    it('custom content', function() {
        var customContent = customContentGet;
        var filteredCustomContent = RequestorFilters.content(customContent);

        assert.lengthOf(Object.keys(filteredCustomContent), 1);
        assert.property(filteredCustomContent.appearance, 'html_body');
        assert.property(filteredCustomContent.appearance, 'stylesheet');
    });

    it('versions', function() {
        var versions = customContentGet.versions;
        var filteredVersions = RequestorFilters.versions(versions);

        filteredVersions.forEach(function(version, index) {
            assert.equal(version.version, 'v' + (index + 1) + '.0');
        });
    });

    describe('#forResource', function() {
        it('can get the filter for a given resource', function() {
            Object.keys(RequestorFilters.resourceToFilterMap).forEach(function(key) {
                var filterName = RequestorFilters.resourceToFilterMap[key];
                var filterFn = RequestorFilters[filterName];

                assert.equal(RequestorFilters.forResource({ resourceType: key }), filterFn);
                assert.isFunction(filterFn);
            });
        });
    });
});
