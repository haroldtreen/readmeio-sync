'use strict';

var assert = require('chai').assert;
var nock = require('nock');
var fs = require('fs');

var UrlGenerator = require('../lib/urlGenerator');
var Requestor = require('../lib/requestor');

var requestor;
var urlGen1 = new UrlGenerator('github-upload', 'v1.0');
var urlGen2 = new UrlGenerator('github-upload', 'v2.0');

describe('Requestor', function() {
    it('is contstructed with url generators + cookie', function() {
        requestor = new Requestor('cookie', [urlGen1, urlGen2]);

        assert.equal(requestor.urlGens.length, 2);
        assert.equal(requestor.cookie, 'cookie');
    });

    it('can request custom content', function(done) {
        requestor = new Requestor('cookie', [urlGen1, urlGen2]);

        nock(urlGen1.base()).get(urlGen1.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v1.json'));
        nock(urlGen2.base()).get(urlGen2.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v2.json'));

        requestor.customContent(function(content) {
            assert.isDefined(content['github-upload']['v1.0'].customContent.appearance.html_body);
            assert.isDefined(content['github-upload']['v2.0'].customContent.appearance.stylesheet);

            done();
        });
    });

    it('can request documentation', function(done) {
        requestor = new Requestor('cookie', [urlGen1, urlGen2]);

        nock(urlGen1.base()).get(urlGen1.docsPath()).reply(200, fs.readFileSync('test/fixtures/docs-v1.json'));
        nock(urlGen2.base()).get(urlGen2.docsPath()).reply(200, fs.readFileSync('test/fixtures/docs-v2.json'));

        requestor.documentation(function(documentation) {
            assert.isDefined(documentation['github-upload']['v1.0'].documentation);
            assert.lengthOf(documentation['github-upload']['v2.0'].documentation, 2);

            done();
        });
    });

    it('can request customPages', function(done) {
        requestor = new Requestor('cookie', [urlGen1, urlGen2]);

        nock(urlGen1.base()).get(urlGen1.pagesPath()).reply(200, fs.readFileSync('test/fixtures/pages-v1.json'));
        nock(urlGen2.base()).get(urlGen2.pagesPath()).reply(200, fs.readFileSync('test/fixtures/pages-v2.json'));

        requestor.customPages(function(documentation) {
            assert.isDefined(documentation['github-upload']['v1.0'].customPages);
            assert.lengthOf(documentation['github-upload']['v2.0'].customPages, 2);

            done();
        });
    });

    it('caches request responses', function(done) {
        requestor = new Requestor('cookie', [urlGen1, urlGen2]);

        var scope = nock(urlGen1.base());
        scope.get(urlGen1.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v1.json'));
        scope.get(urlGen2.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v2.json'));

        scope.get(urlGen1.contentPath()).reply(200, '{ "github-upload": { "v1.0": { "customContent": "bleh" }}}');
        scope.get(urlGen2.contentPath()).reply(200, '{ "github-upload": { "v2.0": { "customContent": "bleh" }}}');

        requestor.customContent(function(response1) {
            requestor.customContent(function(response2) {
                assert.equal(JSON.stringify(response1), JSON.stringify(response2));

                nock.cleanAll();

                done();
            });
        });
    });
});
