'use strict';

var assert = require('chai').assert;
var nock = require('nock');

var fs = require('fs');
var init = require('../lib/initializer');
var UrlGenerator = require('../lib/urlGenerator');

var urlGen;

describe('Initializer', function() {
    before(function() {
        urlGen = new UrlGenerator('github-upload', 'v1.0');
    });

    it('accepts a project info through the configs/project.json', function() {
        var projectInfo = JSON.parse(fs.readFileSync('config/project.json'));
        assert.equal(init.configs.project, projectInfo.project);
        assert.equal(init.configs.apiBase, projectInfo.apiBase);
    });

    it('initializes project info', function(done) {
        nock(urlGen.base()).get(urlGen.versionsPath()).reply(200, fs.readFileSync('test/fixtures/projectInfo.json'));

        init.initProjectInfo({}, function(info) {
            assert(info.length, 2);
            done();
        });
    });
});
