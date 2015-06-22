'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var fs = require('fs');
var nock = require('nock');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var Uploader = require('../lib/uploader');

var projectName = 'github-upload';
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var urlGen2 = new UrlGenerator(projectName, 'v2.0');

var mockAllDocCategoriesRequests = function(uploaderRegistry) {
    var postResponse = js.readFileSync('test/fixtures/doc-category-post.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allDocCategories().forEach(function(category) {
        var requestFn = category.slug ? 'put' : 'post';
        var urlFn = category.slug ? 'docCategoriesPutPath' : 'docCategoriesPostPath';
        var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;

        scope[requestFn](urlGen[urlFn](category.slug), { title: category.title }).reply(200, postResponse);
    });
};

var mockAllDocRequests = function(uploaderRegistry) {
    var postResponse = js.readFileSync('test/fixtures/doc-post.json');
    var scope = nock(urlGen1.base());

    // Create network request mocks
    uploaderRegistry.allDocs().forEach(function(doc) {
        var requestFn = doc.slug ? 'put' : 'post';
        var urlFn = doc.slug ? 'docsPutPath' : 'docsPostPath';
        var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
        var slug = doc.slug || doc.categorySlug;

        var requestBody = { title: doc.title, excerpt: doc.excerpt, body: fs.readFileSync(doc.body).toString(), type: doc.type };
        scope[requestFn](urlGen[urlFn](slug), requestBody).reply(200, postResponse);
    });
};

var mockAllPageRequests = function(uploaderRegistry) {
    var postResponse = js.readFileSync('test/fixtures/custom-page-post.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allCustomPages().forEach(function(page) {
        var requestFn = page.slug ? 'put' : 'post';
        var urlFn = page.slug ? 'pagesPutPath' : 'pagesPostPath';
        var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;

        var requestBody = { title: page.title, body: fs.readFileSync(page.body).toString() }; //, version: page.version.replace('v', ''), subdomain: 'github-upload' };
        scope[requestFn](urlGen[urlFn](page.slug), requestBody).reply(200, postResponse);
    });
};

var mockAllContentRequests = function(uploaderRegistry) {
    var putResponse = js.readFileSync('test/fixtures/content-put.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allCustomContent().forEach(function(content) {
        var appearance = content.appearance;
        var urlGen = content.version === 'v1.0' ? urlGen1 : urlGen2;
        var requestBody = { appearance: { html_head: fs.readFileSync(appearance.html_head), stylesheet: fs.readFileSync(appearance.stylesheet) }};

        scope.put(urlGen.contentPutPath(), requestBody).reply(200, putResponse);
    });
};

describe('Uploader', function() {
    var uploader;
    var registry;
    var assertUploaded = function(resource) {
        assert.isDefined(resource.slug);
    };

    beforeEach(function() {
        registry = new Registry();
        registry.import(js.readFileSync('test/fixtures/syncRegistry.json'));
        uploader = new Uploader(registry);
    });

    it('maintains a link to a registry', function() {
        assert.equal(uploader.registry, registry);
    });

    it('uploads docs', function(done) {
        mockAllDocCategoriesRequests(registry);
        mockAllDocRequests(registry);

        uploader.uploadDocs('cookie', function(uploadedRegistry) {
            uploadedRegistry.allDocs().forEach(assertUploaded);
            uploadedRegistry.allDocCategories().forEach(assertUploaded);

            done();
        });
    });

    it('uploads custom pages', function(done) {
        mockAllPageRequests(registry);

        uploader.uploadCustomPages('cookie', function(uploadedRegistry) {
            uploadedRegistry.allCustomPages().forEach(assertUploaded);

            done();
        });
    });

    it('uploads custom content', function(done) {
        mockAllContentRequests(registry);

        uploader.uploadCustomContent('cookie', function(uploadedRegistry) {
            done();
        });
    });
});
