'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var fs = require('fs');
var nock = require('nock');
var simple = require('simple-mock');

var RequestMocker = require('./helpers/requestMocker');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var Uploader = require('../lib/uploader');

var projectName = 'github-upload';
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var urlGen2 = new UrlGenerator(projectName, 'v2.0');

describe('Uploader', function() {
    var uploader;
    var registry;
    var remoteRegistry;
    var requestMocker;

    var assertUploaded = function(resource) {
        assert.isDefined(resource.slug);
    };

    beforeEach(function() {
        registry = new Registry(js.readFileSync('test/fixtures/syncRegistry.json'));
        remoteRegistry = new Registry(js.readFileSync('test/fixtures/registry-data-state1.json'));
        uploader = new Uploader(registry, 'cookie');

        requestMocker = new RequestMocker(registry);
    });

    it('maintains a link to a registry', function() {
        assert.equal(uploader.registry, registry);
    });

    it('uploads docs', function(done) {
        var scope = nock(urlGen1.base());
        scope = requestMocker.mockVersionDownload(scope);
        scope = requestMocker.mockRemoteRegistryDownload(scope);
        scope = requestMocker.mockDocCategoriesUpload(scope, remoteRegistry);
        scope = requestMocker.mockDocsUpload(scope, remoteRegistry);

        uploader.uploadDocs(function(uploadedRegistry) {
            uploadedRegistry.allDocs().forEach(assertUploaded);
            uploadedRegistry.allDocCategories().forEach(assertUploaded);

            assert.isTrue(scope.isDone(), 'some requests were not made');
            done();
        });
    });

    it('uploads custom pages', function(done) {
        var scope = nock(urlGen1.base());
        scope = requestMocker.mockVersionDownload(scope);
        scope = requestMocker.mockRemoteRegistryDownload(scope);
        scope = requestMocker.mockPagesUpload(scope, remoteRegistry);

        uploader.uploadCustomPages(function(uploadedRegistry) {
            uploadedRegistry.allCustomPages().forEach(assertUploaded);

            assert.isTrue(scope.isDone(), 'some requests endpoints were not made');
            done();
        });
    });

    it('uploads custom content', function(done) {
        var scope = nock(urlGen1.base());
        scope = requestMocker.mockContentUpload(scope);

        uploader.uploadCustomContent(function(uploadedRegistry) {
            assert.isTrue(scope.isDone());
            done();
        });
    });

    it('can upload all content', function() {
        var contentStub = simple.mock(uploader, 'uploadCustomContent').callbackWith(registry);
        var pagesStub = simple.mock(uploader, 'uploadCustomPages').callbackWith(registry);
        var docsStub = simple.mock(uploader, 'uploadDocs').callbackWith(registry);
        var orderStub = simple.mock(uploader, 'uploadDocsOrder').callbackWith(registry);

        uploader.uploadAll(function(uploadedRegistry) {
            assert.equal(uploadedRegistry, registry);
            assert.equal(contentStub.callCount, 1);
            assert.equal(pagesStub.callCount, 1);
            assert.equal(docsStub.callCount, 1);
            assert.equal(orderStub.callCount, 1);
        });
        simple.restore();
    });

    it('can upload a doc page order', function(done) {
        registry = new Registry(js.readFileSync('test/fixtures/orderedRegistry.json'));
        requestMocker = new RequestMocker(registry);
        uploader.registry = registry;

        var scope = nock(urlGen1.base());
        scope = requestMocker.mockDocsOrderUpload(scope);

        uploader.uploadDocsOrder(function() {
            assert.isTrue(scope.isDone());
            done();
        });
    });
});
