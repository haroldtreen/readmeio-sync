'use strict';

var path = require('path');
var assert = require('chai').assert;

var RegistryBuilder = require('../lib/registryBuilder');

describe('Registry Builder', function() {

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
                    assert.equal(page.body, path.join(docsPath, category.order + '-' + category.title, page.order + '-' + page.slug + '.md'));
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
            var page = RegistryBuilder.parseMdFile('test/fixtures/project-fixture/v1.0/documentation/1-Category 1/1-v1-c1-p1.md');

            assert.equal(page.title, 'V1-C1-P1');
            assert.equal(page.order, 1);
            assert.equal(page.excerpt, 'Version 1, Category 1, Page 1');
            assert.equal(page.slug, 'v1-c1-p1');
        });
    });
});
