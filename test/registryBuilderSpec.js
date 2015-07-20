'use strict';

var path = require('path');
var assert = require('chai').assert;
var simple = require('simple-mock');

var RegistryBuilder = require('../lib/registryBuilder');

describe('Registry Builder', function() {

    describe('building full registry', function() {
        var buildSettings = {
            'github-upload': {
                'v1.0': {
                    documentation: 'test/fixtures/project-fixture/v1.0/documentation',
                    customPages: 'test/fixtures/project-fixture/v1.0/customPages',
                    customContent: {
                        appearance: {
                            html_body: 'test/fixtures/project-fixture/v1.0/customContent/html_body.html',
                            stylesheet: 'test/fixtures/project-fixture/v1.0/customContent/stylesheet.css'
                        }
                    }
                }
            }
        };

        it('calls all the section builders', function() {
            var docsSectionMock = simple.mock(RegistryBuilder, 'docsSection').callFn(function(input) { return input; });
            var customPagesSectionMock = simple.mock(RegistryBuilder, 'customPagesSection').callFn(function(input) { return input; });
            var customContentSectionMock = simple.mock(RegistryBuilder, 'customContentSection').callFn(function(input) { return input; });

            RegistryBuilder.build(buildSettings);

            var settingsV1 = buildSettings['github-upload']['v1.0'];

            assert.equal(docsSectionMock.lastCall.args[0], settingsV1.documentation);
            assert.equal(customPagesSectionMock.lastCall.args[0], settingsV1.customPages);
            assert.equal(customContentSectionMock.lastCall.args[0], settingsV1.customContent);

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
                    assert.equal(page.order, pIdx);
                });
            });
        });

        it('can parse categories', function() {
            var category = RegistryBuilder.parseCategory('1-Category 1');

            assert.equal(category.title, 'Category 1');
            assert.equal(category.slug, 'category-1');
            assert.equal(category.order, 1);
        });

        it('can parse pages', function() {
            var page = RegistryBuilder.parseMdFile('test/fixtures/project-fixture/v1.0/documentation/1-Category 1/1-V1-C1-P1.md');

            assert.equal(page.title, 'V1-C1-P1');
            assert.equal(page.order, 1);
            assert.equal(page.excerpt, 'Version 1, Category 1, Page 1');
            assert.equal(page.slug, 'v1-c1-p1');
        });
    });

    describe('custom pages', function() {
        var customPagesPath = 'test/fixtures/project-fixture/v1.0/customPages';
        it('can build the custom page section', function() {
            var customPages = RegistryBuilder.customPagesSection(customPagesPath);

            customPages.forEach(function(page, idx) {
                idx++;

                assert.equal(page.title, 'Page' + idx);
                assert.equal(page.order, idx);
                assert.equal(page.html, path.join(customPagesPath, page.order + '-' + page.title + '.html'));
            });
        });
    });
});
