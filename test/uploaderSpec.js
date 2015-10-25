'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var nock = require('nock');
var mockery = require('mockery');
var simple = require('simple-mock');

var Uploader = require('../lib/Uploader');
var RequestMocker = require('./helpers/requestMocker');
var RequestorMock = require('./mocks/requestorMock');
var DownloaderMock = require('./mocks/downloaderMock');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var RegistryBuilder = require('../lib/registryBuilder');

var projectName = 'github-upload';
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var requestorMock = new RequestorMock();

describe('Uploader', function() {
    var uploader;
    var registry;
    var requestMocker;

    var assertRequested = function(fn, resource) {
        assert.include(fn.lastCall.args[0], resource);
    };

    it('maintains a link to a registry', function() {
        registry = RegistryBuilder.build(js.readFileSync('test/fixtures/syncPaths.json'));
        uploader = new Uploader(registry, 'cookie');
        assert.equal(uploader.registry, registry);
    });

    describe('uploads', function() {
        beforeEach(function() {
            mockery.enable({
                warnOnReplace: false,
                warnOnUnregistered: false,
                useCleanCache: true
            });
            mockery.registerMock('./requestor', RequestorMock);
            mockery.registerMock('./downloader', DownloaderMock);

            Uploader = require('../lib/uploader');

            registry = RegistryBuilder.build(js.readFileSync('test/fixtures/syncPaths.json'));
            uploader = new Uploader(registry, 'cookie');
        });

        afterEach(function() {
            mockery.disable();
        });

        it('docs', function(done) {
            uploader.uploadDocs(function(uploadedRegistry) {
                uploadedRegistry.allDocs().forEach(assertRequested.bind(null, requestorMock.uploadDocs));
                uploadedRegistry.allDocCategories().forEach(assertRequested.bind(null, requestorMock.uploadDocCategories));

                done();
            });
        });

        it('custom pages', function(done) {
            uploader.uploadCustomPages(function(uploadedRegistry) {
                uploadedRegistry.allCustomPages().forEach(assertRequested.bind(null, requestorMock.uploadPages));

                done();
            });
        });

        it('uploads custom content', function(done) {
            uploader.uploadCustomContent(function(uploadedRegistry) {
                uploadedRegistry.allCustomContent().forEach(assertRequested.bind(null, requestorMock.uploadContent));
                done();
            });
        });

        it('all content', function() {
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
    });


    it('can upload a doc page order', function(done) {
        Uploader = require('../lib/Uploader');
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
