'use strict';

var assert = require('chai').assert;
var nock = require('nock');
var js = require('jsonfile');

var Downloader = require('../lib/downloader');
var UrlGenerator = require('../lib/urlGenerator');

var downloader;
var urlGen1 = new UrlGenerator('github-upload', 'v1.0');
var urlGen2 = new UrlGenerator('github-upload', 'v2.0');

var mockVersionsDownload = function(scope) {
    scope.get(urlGen1.versionsPath()).reply(200, js.readFileSync('test/fixtures/project-versions.json'));
    return scope;
};

var mockRemoteRegistryGet = function(scope) {
    ['docs', 'content', 'pages'].forEach(function(section) {
        scope.get(urlGen1[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v1.json'));
        scope.get(urlGen2[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v2.json'));
    });
    return scope;
};

describe('Downloader', function() {

    beforeEach(function() {
        downloader = new Downloader('github-upload', 'cookie');
    });

    it('should be able to build a registry by requesting hosted content', function(done) {
        var scope = nock(urlGen1.base());
        scope = mockVersionsDownload(scope);
        scope = mockRemoteRegistryGet(scope);

        downloader.downloadRemoteRegistry(function(remoteRegistry) {
            assert.include(remoteRegistry.versions, 'v1.0');
            assert.include(remoteRegistry.versions, 'v2.0');

            assert.lengthOf(remoteRegistry.allDocs(), 7);
            assert.lengthOf(remoteRegistry.allCustomPages(), 4);

            assert.isTrue(scope.isDone());
            done();
        });
    });

    it('should be able to download project versions', function(done) {
        var scope = nock(urlGen1.base());
        scope = mockVersionsDownload(scope);

        downloader.downloadVersions(function(versions) {
            console.log(versions);
            assert.lengthOf(versions, 2);
            assert.include(versions, { version: 'v1.0' });
            assert.include(versions, { version: 'v2.0' });

            assert.isTrue(scope.isDone());

            done();
        });
    });
});
