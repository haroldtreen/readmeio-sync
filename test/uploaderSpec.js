'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var fs = require('fs');
var nock = require('nock');
var simple = require('simple-mock');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var Uploader = require('../lib/uploader');

var projectName = 'github-upload';
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var urlGen2 = new UrlGenerator(projectName, 'v2.0');

var mockVersionsDownload = function(scope) {
    scope.get(urlGen1.versionsPath()).reply(200, js.readFileSync('test/fixtures/project-versions.json'));
    return scope;
};

var mockRemoteRegistryGet = function() {
    var scope = nock(urlGen1.base());
    scope = mockVersionsDownload(scope);

    ['docs', 'content', 'pages'].forEach(function(section) {
        scope.get(urlGen1[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v1.json'));
        scope.get(urlGen2[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v2.json'));
    });
    return scope;
};

var mockAllDocCategoriesRequests = function(uploaderRegistry, remoteRegistry) {
    var diff = uploaderRegistry.diff(remoteRegistry);
    var postResponse = js.readFileSync('test/fixtures/doc-category-post.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allDocCategories().forEach(function(category) {
        var isAdded = diff.isAdded('allDocCategories', { slug: category.slug, version: category.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = isAdded ? 'docCategoriesPostPath' : 'docCategoriesPutPath';
        var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;

        scope[requestFn](urlGen[urlFn](category.slug), { title: category.title }).reply(200, postResponse);
    });
    return scope;
};

var mockAllDocRequests = function(uploaderRegistry, remoteRegistry) {
    var diff = uploaderRegistry.diff(remoteRegistry);
    var postResponse = js.readFileSync('test/fixtures/doc-post.json');
    var scope = nock(urlGen1.base());

    // Create network request mocks
    uploaderRegistry.allDocs().forEach(function(doc) {
        var isAdded = diff.isAdded('allDocs', { slug: doc.slug, version: doc.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = doc.slug ? 'docsPostPath' : 'docsPutPath';
        var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
        var slug = isAdded ? doc.categorySlug : doc.slug;

        var requestBody = { title: doc.title, excerpt: doc.excerpt, body: fs.readFileSync(doc.body).toString(), type: doc.type };
        scope[requestFn](urlGen[urlFn](slug), requestBody).reply(200, postResponse);
    });
    return scope;
};

var mockAllPageRequests = function(uploaderRegistry, remoteRegistry) {
    var diff = uploaderRegistry.diff(remoteRegistry);
    var postResponse = js.readFileSync('test/fixtures/custom-page-post.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allCustomPages().forEach(function(page) {
        var isAdded = diff.isAdded('allCustomPages', { slug: page.slug, version: page.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = isAdded ? 'pagesPostPath' : 'pagesPutPath';
        var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;

        var requestBody = { title: page.title, html: fs.readFileSync(page.html).toString(), htmlmode: true, fullscreen: true, body: 'body' }; //, version: page.version.replace('v', ''), subdomain: 'github-upload' };
        scope[requestFn](urlGen[urlFn](page.slug), requestBody).reply(200, postResponse);
    });
    return scope;
};

var mockAllContentRequests = function(uploaderRegistry) {
    var putResponse = js.readFileSync('test/fixtures/content-put.json');
    var scope = nock(urlGen1.base());

    uploaderRegistry.allCustomContent().forEach(function(content) {
        var appearance = content.appearance;
        var urlGen = content.version === 'v1.0' ? urlGen1 : urlGen2;
        var requestBody = { appearance: { html_body: fs.readFileSync(appearance.html_body).toString(), stylesheet: fs.readFileSync(appearance.stylesheet).toString() }};
        scope.put(urlGen.contentPutPath(), requestBody).reply(200, putResponse);
    });
    return scope;
};

var DownloaderMock = function() {};
DownloaderMock.prototype.downloadRemoteRegistry = function(cb) {
    var remoteRegistry = new Registry(js.readFileSync('test/fixtures/registry-data-state1.json'));
    cb(remoteRegistry);
};

describe('Uploader', function() {
    var uploader;
    var registry;
    var remoteRegistry;

    var assertUploaded = function(resource) {
        assert.isDefined(resource.slug);
    };

    beforeEach(function() {
        registry = new Registry(js.readFileSync('test/fixtures/syncRegistry.json'));
        remoteRegistry = new Registry(js.readFileSync('test/fixtures/registry-data-state1.json'));
        uploader = new Uploader(registry, 'cookie');
    });

    it('maintains a link to a registry', function() {
        assert.equal(uploader.registry, registry);
    });

    it('uploads docs', function(done) {
        var downloadScope = mockRemoteRegistryGet();
        var categoriesScope = mockAllDocCategoriesRequests(registry, remoteRegistry);
        var docsScope = mockAllDocRequests(registry, remoteRegistry);

        uploader.uploadDocs(function(uploadedRegistry) {
            uploadedRegistry.allDocs().forEach(assertUploaded);
            uploadedRegistry.allDocCategories().forEach(assertUploaded);

            assert.isTrue(downloadScope.isDone(), 'some download endpoints were not called');
            assert.isTrue(categoriesScope.isDone(), 'some category endpoints were not called');
            assert.isTrue(docsScope.isDone(), 'some doc endpoints weren not called');
            done();
        });
    });

    it('uploads custom pages', function(done) {
        var downloadScope = mockRemoteRegistryGet();
        var scope = mockAllPageRequests(registry, remoteRegistry);

        uploader.uploadCustomPages(function(uploadedRegistry) {
            uploadedRegistry.allCustomPages().forEach(assertUploaded);

            assert.isTrue(downloadScope.isDone(), 'some download endpoints were not called');
            assert.isTrue(scope.isDone(), 'some page endpoints were not called');
            done();
        });
    });

    it('uploads custom content', function(done) {
        var scope = mockAllContentRequests(registry);

        uploader.uploadCustomContent(function(uploadedRegistry) {
            assert.isTrue(scope.isDone());
            done();
        });
    });

    it('can upload all content', function() {
        var contentStub = simple.mock(uploader, 'uploadCustomContent').callbackWith(registry);
        var pagesStub = simple.mock(uploader, 'uploadCustomPages').callbackWith(registry);
        var docsStub = simple.mock(uploader, 'uploadDocs').callbackWith(registry);

        uploader.uploadAll(function(uploadedRegistry) {
            assert.equal(uploadedRegistry, registry);
            assert.equal(contentStub.callCount, 1);
            assert.equal(pagesStub.callCount, 1);
            assert.equal(docsStub.callCount, 1);
        });
        simple.restore();
    });
});
