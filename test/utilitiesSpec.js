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

    it('can generate a slug from a title', function() {
        assert.equal(utils.titleToSlug('Category 1'), 'category-1');
        assert.equal(utils.titleToSlug('Category. Two.'), 'category-two');
        assert.equal(utils.titleToSlug('CATEGORY^^%$#'), 'category');
    });

    it('can extract md metadata', function() {
        var markdown = fs.readFileSync('test/fixtures/markdown.md').toString();

        var metadata = utils.mdMetadata(markdown);

        assert.equal(metadata.title, 'Markdown File');
        assert.equal(metadata.excerpt, 'Description of Markdown File');
    });
});
