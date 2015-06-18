'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var fs = require('fs');
var nock = require('nock');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var Uploader = require('../lib/uploader');

var registry;
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

describe('Uploader', function() {
    before(function() {
        registry = new Registry();
    });

    it('maintains a link to a registry', function() {
        registry.import(js.readFileSync('test/fixtures/syncRegistry.json'));
        var uploader = new Uploader(registry);

        assert.equal(uploader.registry, registry);
    });


    it('uploads docs', function(done) {
        registry.import(js.readFileSync('test/fixtures/syncRegistry.json'));

        var uploader = new Uploader(registry);
        var assertUploaded = function(resource) {
            assert.isDefined(resource.slug);
        };

        mockAllDocCategoriesRequests(registry);
        mockAllDocRequests(registry);

        uploader.uploadDocs('cookie', function(uploadedRegistry) {
            uploadedRegistry.allDocs().forEach(assertUploaded);
            uploadedRegistry.allDocCategories().forEach(assertUploaded);

            done();
        });
    });
});
