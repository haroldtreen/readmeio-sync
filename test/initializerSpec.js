'use strict';

var assert = require('chai').assert;
var nock = require('nock');
var fs = require('fs');

var Initializer = require('../lib/initializer');
var UrlGenerator = require('../lib/urlGenerator');

describe('Initializer', function() {
    it('initializes project info', function(done) {
        var urlGenv1 = new UrlGenerator('github-upload', 'v1.0');
        var urlGenv2 = new UrlGenerator('github-upload', 'v2.0');

        var scope = nock(urlGenv1.base());
        scope.get(urlGenv1.versionsPath()).reply(200, fs.readFileSync('test/fixtures/project-versions.json'));
        scope.get(urlGenv1.docsPath()).reply(200, fs.readFileSync('test/fixtures/docs-v1.json'));
        scope.get(urlGenv2.docsPath()).reply(200, fs.readFileSync('test/fixtures/docs-v2.json'));
        scope.get(urlGenv1.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v1.json'));
        scope.get(urlGenv2.contentPath()).reply(200, fs.readFileSync('test/fixtures/content-v2.json'));
        scope.get(urlGenv1.pagesPath()).reply(200, fs.readFileSync('test/fixtures/pages-v1.json'));
        scope.get(urlGenv2.pagesPath()).reply(200, fs.readFileSync('test/fixtures/pages-v2.json'));

        var initializer = new Initializer('cookie');

        initializer.initProjectInfo('test/tmp', function(registry) {
            var files = fs.readdirSync('test/tmp');

            assert.isDefined(registry.version('v1.0'));
            assert.isAbove(files.indexOf('syncRegistry.json'), -1, 'Registry file was not created');

            fs.unlink('test/tmp/syncRegistry.json');

            done();
        });
    });
});

