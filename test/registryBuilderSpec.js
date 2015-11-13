'use strict';

var js = require('jsonfile');
var path = require('path');
var assert = require('chai').assert;
var simple = require('simple-mock');

var RegistryBuilder = require('../lib/registryBuilder');
var Document = require('../lib/resources/document');

describe('Registry Builder', function() {

    describe('building full registry', function() {
        var buildSettings = js.readFileSync('test/fixtures/syncPaths.json');

        it('calls all the section builders', function() {
            var docsSectionMock = simple.mock(RegistryBuilder, 'docsSection').callFn(function(input) { return input; });
            var customPagesSectionMock = simple.mock(RegistryBuilder, 'customPagesSection').callFn(function(input) { return input; });
            var customContentSectionMock = simple.mock(RegistryBuilder, 'customContentSection').callFn(function(input) { return input; });

            RegistryBuilder.build(buildSettings);

            var settingsV2 = buildSettings['github-upload']['v2.0'];

            assert.equal(docsSectionMock.lastCall.args[0], settingsV2.documentation);
            assert.equal(customPagesSectionMock.lastCall.args[0], settingsV2.customPages);
            assert.equal(customContentSectionMock.lastCall.args[0], settingsV2.customContent);

            simple.restore();
        });
    });

    describe('documentation', function() {
        var docsPath = 'test/fixtures/project-fixture/v1.0/documentation';

        it('can build the documentation section', function() {
            var documentation = RegistryBuilder.docsSection(docsPath);

            documentation.forEach(function(category, cIdx) {
                cIdx++;

                assert.equal(category.title, 'Category ' + cIdx);
                assert.equal(category.slug, 'category-' + cIdx);
                assert.equal(category.order, cIdx);

                category.pages.forEach(function(page, pIdx) {
                    pIdx++;

                    assert.equal(page.slug, 'v1-c' + cIdx + '-p' + pIdx);
                    assert.equal(page.title, 'V1-C' + cIdx + '-P' + pIdx);
                    assert.equal(page.excerpt, 'Version 1, Category ' + cIdx + ', Page ' + pIdx);
                    assert.equal(page.body, path.join(docsPath, category.order + '-' + category.title, page.order + '-' + page.title + '.md'));
                    assert.match(path.basename(page.body), Document.filenameRegex);
                    assert.equal(page.order, pIdx);
                });
            });
        });
    });

    describe('custom pages', function() {
        var customPagesPath = 'test/fixtures/project-fixture/v1.0/customPages';
        it('can build the custom page section', function() {
            var customPages = RegistryBuilder.customPagesSection(customPagesPath);

            customPages.forEach(function(page, idx) {
                idx++;

                assert.equal(page.title, 'Page' + idx);
                assert.equal(page.html, path.join(customPagesPath, page.title + '.html'));
            });
        });
    });
});
