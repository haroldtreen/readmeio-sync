'use strict';

var assert = require('chai').assert;
var UrlGenerator = require('../lib/urlGenerator');
var config = require('../lib/config');

var urlGen;
describe('UrlGenerator', function() {
    before(function() {
        urlGen = new UrlGenerator('github-upload', 'v1.0');
    });

    it('knows a base url', function() {
        assert.equal(urlGen.base(), 'https://dash.readme.io');
    });

    it('knows an api url', function() {
        assert.equal(urlGen.apiBase(), 'https://dash.readme.io/api');
    });

    it('knows the docs url', function() {
        assert.equal(urlGen.docsUrl(), 'https://dash.readme.io/api/projects/github-upload/v1.0/docs');
    });

    it('knows the versions url', function() {
        assert.equal(urlGen.versionsUrl(), 'https://dash.readme.io/api/projects-v/github-upload');
    });

    it('knows the content url', function() {
        assert.equal(urlGen.contentUrl(), 'https://dash.readme.io/api/projects/github-upload/v1.0');
    });

    it('knows the pages url', function() {
        assert.equal(urlGen.pagesUrl(), 'https://dash.readme.io/api/projects/github-upload/v1.0/page');
    });

    it('can pass a slug to pages', function() {
        assert.equal(urlGen.pagesUrl('test-page'), 'https://dash.readme.io/api/projects/github-upload/v1.0/page/test-page');
    });

    it('pulls api base from config', function() {
        assert.equal(urlGen.base(), config.apiBase);
    });

    describe('post/put urls', function() {
        it('can be generated for docs post', function() {
            assert.equal(urlGen.docsPostUrl('category-slug'), 'https://dash.readme.io/api/projects/github-upload/v1.0/docs/category-slug');
        });

        it('can be generated for docs put', function() {
            assert.equal(urlGen.docsPutUrl('doc-slug'), 'https://dash.readme.io/api/projects/github-upload/v1.0/docs/doc-slug');
        });

        it('can be generated for doc category post', function() {
            assert.equal(urlGen.docCategoriesPostUrl(), 'https://dash.readme.io/api/projects/github-upload/v1.0/category');
        });

        it('can be generated for doc category put', function() {
            assert.equal(urlGen.docCategoriesPutUrl('updated-category'), 'https://dash.readme.io/api/projects/github-upload/v1.0/category/updated-category');
        });
    });
});
