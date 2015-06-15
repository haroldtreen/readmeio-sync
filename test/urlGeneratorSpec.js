'use strict';

var assert = require('chai').assert;
var UrlGenerator = require('../lib/urlGenerator');

var js = require('jsonfile');

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

    it('pulls api base from project.json', function() {
        var projectSettings = js.readFileSync('config/project.json');
        assert.equal(urlGen.base(), projectSettings.apiBase);
    });
});
