'use strict';

var fs = require('fs');
var assert = require('chai').assert;

var utils = require('../lib/utils');

describe('Utilities', function() {
    it('can add readmeio markdown styles', function() {
        var markdown = fs.readFileSync('test/fixtures/markdown.md').toString();
        var readmeMarkdown = utils.mdToReadme(markdown);

        assert.match(markdown, utils.markdownCodeRegex);
        assert.match(readmeMarkdown, utils.readmeCodeRegex);

        assert.notMatch(markdown, utils.readmeCodeRegex);
        assert.notMatch(readmeMarkdown, utils.markdownCodeRegex);
    });
});
