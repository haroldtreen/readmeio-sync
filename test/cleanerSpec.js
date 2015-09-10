'use strict';

var js = require('jsonfile');
var assert = require('chai').assert;
var nock = require('nock');

var UrlGenerator = require('../lib/urlGenerator');
var Registry = require('../lib/registry');
var Cleaner = require('../lib/cleaner');

var urlGen = new UrlGenerator('github-upload');
var localRegistry;
var remoteRegistry;

var mockRemoteRegistryGet = function(scope) {
    var urlGen1 = new UrlGenerator('github-upload', 'v1.0');
    var urlGen2 = new UrlGenerator('github-upload', 'v2.0');

    ['docs', 'content', 'pages'].forEach(function(section) {
        scope.get(urlGen1[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v1.json'));
        scope.get(urlGen2[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v2.json'));
    });
    return scope;
};

var mockDocDelete = function(diff) {
    var scope = nock(urlGen.base());

    scope = mockRemoteRegistryGet(scope);

    diff.deleted.allDocs.forEach(function(doc) {
        urlGen.version = doc.version;
        scope.delete(urlGen.docsDeletePath(doc.slug)).reply(200, { success: true });
    });

    return scope;
};

var mockDocCategoriesDelete = function(diff) {
    var scope = nock(urlGen.base());

    scope = mockRemoteRegistryGet(scope);

    diff.deleted.allDocCategories.forEach(function(category) {
        urlGen.version = category.version;
        scope.delete(urlGen.docCategoriesDeletePath(category.slug)).reply(200, { success: true });
    });

    return scope;
};

var mockPageDelete = function(diff) {
    var scope = nock(urlGen.base());

    scope = mockRemoteRegistryGet(scope);

    diff.deleted.allCustomPages.forEach(function(page) {
        urlGen.version = page.version;
        scope.delete(urlGen.pagesDeletePath(page.slug)).reply(200, { success: true });
    });

    return scope;
};

describe('Cleaning', function() {
    var diff;

    beforeEach(function() {
        var localData = js.readFileSync('test/fixtures/localSyncRegistry.json');
        var remoteData = js.readFileSync('test/fixtures/remoteSyncRegistry.json');

        localRegistry = new Registry(localData);
        remoteRegistry = new Registry(remoteData);

        diff = localRegistry.diff(remoteRegistry);
    });

    it('deletes docs not specified in the sync registry', function(done) {
        var scope = mockDocDelete(diff);

        var cleaner = new Cleaner(localRegistry, 'cookie');

        cleaner.cleanDocs(function(successfulDeletes) {
            assert.lengthOf(successfulDeletes, diff.deleted.allDocs.length);
            assert.isTrue(scope.isDone());

            done();
        });
    });

    it('deletes doc categories not specified in the sync registry', function(done) {
        var scope = mockDocCategoriesDelete(diff);

        var cleaner = new Cleaner(localRegistry, 'cookie');

        cleaner.cleanDocCategories(function(successfulDeletes) {
            assert.lengthOf(successfulDeletes, diff.deleted.allDocCategories.length);
            assert.isTrue(scope.isDone());

            done();
        });
    });

    it('deletes pages not specified in the sync registry', function(done) {
        var scope = mockPageDelete(diff);

        var cleaner = new Cleaner(localRegistry, 'cookie');

        cleaner.cleanPages(function(successfulDeletes) {
            assert.lengthOf(successfulDeletes, diff.deleted.allCustomPages.length);
            assert.isTrue(scope.isDone());

            done();
        });
    });

    it('deletes all unspecified content', function() {
        var cleaner = new Cleaner(localRegistry, 'cookie');
        var methods = ['cleanDocs', 'cleanDocCategories', 'cleanPages'];
        var calledMethods = [];

        methods.forEach(function(method) {
            cleaner[method] = function(cb) {
                calledMethods.push(method);
                cb([]);
            };
        });

        cleaner.cleanAll(function() {
            methods.forEach(function(method) {
                assert.isAbove(calledMethods.indexOf(method), -1, method + ' wasn\'t called!');
            });
        });

    });
});
