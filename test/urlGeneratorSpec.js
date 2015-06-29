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

    it('pulls api base from config', function() {
        assert.equal(urlGen.base(), config.apiBase);
    });

    describe('get urls', function() {
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
    });

    describe('post/put urls', function() {
        it('can be generated for docs post', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/docs/category-slug';
            assert.equal(urlGen.docsPostUrl('category-slug'), expectedUrl);
        });

        it('can be generated for docs put', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/docs/doc-slug';
            assert.equal(urlGen.docsPutUrl('doc-slug'), expectedUrl);
        });

        it('can be generated for doc category post', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/category';
            assert.equal(urlGen.docCategoriesPostUrl(), expectedUrl);
        });

        it('can be generated for doc category put', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/category/updated-category';
            assert.equal(urlGen.docCategoriesPutUrl('updated-category'), expectedUrl);
        });

        it('can be generated for page post', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/page';
            assert.equal(urlGen.pagesPostUrl(), expectedUrl);
        });

        it('can be generated for page put', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/page/updated-page';
            assert.equal(urlGen.pagesPutUrl('updated-page'), expectedUrl);
        });

        it('can be generated for content put', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0';
            assert.equal(urlGen.contentPutUrl(), expectedUrl);
        });
    });

    describe('delete urls', function() {
        it('knows the doc url', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/docs/docs-slug';
            assert.equal(urlGen.docsDeleteUrl('docs-slug'), expectedUrl);
        });

        it('knows the doc categories url', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/category/category-slug';
            assert.equal(urlGen.docCategoriesDeleteUrl('category-slug'), expectedUrl);
        });

        it('knows the pages url', function() {
            var expectedUrl = 'https://dash.readme.io/api/projects/github-upload/v1.0/page/pages-slug';
            assert.equal(urlGen.pagesDeleteUrl('pages-slug'), expectedUrl);
        });
    });
});
