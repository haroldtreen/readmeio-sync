'use strict';

var assert = require('chai').assert;
var Registry = require('../lib/registry');
var js = require('jsonfile');
var fs = require('fs');

var mockContents;
var registry;

describe('Registry', function() {
    before(function() {
        mockContents = js.readFileSync('test/fixtures/readmeContent.json');
    });

    it('can set its contents', function() {
        registry = new Registry(mockContents);

        assert.equal(registry.projectName, 'github-upload');
        assert.deepEqual(registry.versions, ['v2.0', 'v1.0']);
        assert.equal(registry.export(), mockContents);
    });

    it('can diff itself against other registries', function() {
        var registry1 = new Registry(js.readFileSync('test/fixtures/registry-data-state1.json'));
        var registry2 = new Registry(js.readFileSync('test/fixtures/registry-data-state2.json'));

        var diffs = registry1.diff(registry2);

        assert.lengthOf(diffs.deleted.allCustomPages, 2);
        assert.lengthOf(diffs.deleted.allDocs, 3);
        assert.lengthOf(diffs.deleted.allDocCategories, 1);

        assert.lengthOf(diffs.added.allCustomPages, 2);
        assert.lengthOf(diffs.added.allDocs, 3);
        assert.lengthOf(diffs.added.allDocCategories, 1);

        ['allCustomPages', 'allDocs', 'allDocCategories'].forEach(function(section) {
            diffs.deleted[section].forEach(function(diff) { assert.match(diff.slug, /state2/); });
            diffs.added[section].forEach(function(diff) { assert.match(diff.slug, /state1/); });
        });
    });

    it('has helpers on diff object', function() {
        var registry1 = new Registry(js.readFileSync('test/fixtures/registry-data-state1.json'));
        var registry2 = new Registry(js.readFileSync('test/fixtures/registry-data-state2.json'));

        var diffs = registry1.diff(registry2);

        assert.isTrue(diffs.isAdded('allDocCategories', { slug: 'state1-category', version: 'v1.0'}), 'add missing');
        assert.isTrue(diffs.isDeleted('allDocs', { slug: 'state2-page-v2', version: 'v2.0'}), 'delete missing');

        assert.isFalse(diffs.isAdded('allDocs', { slug: 'state2-page-v2', version: 'v2.0'}), 'incorrect add found');
        assert.isFalse(diffs.isDeleted('allCustomPages', { slug: 'state1-page-v2', version: 'v2.0'}), 'incorrect delete found');
    });

    describe('contents', function() {
        before(function() {
            registry = new Registry(mockContents);
        });

        it('can pull documentation data', function() {
            assert.equal(registry.docs('v1.0'), mockContents['github-upload']['v1.0'].documentation);
        });

        it('can pull custom content data', function() {
            assert.equal(registry.content('v1.0'), mockContents['github-upload']['v1.0'].customContent);
        });

        it('can pull custom page data', function() {
            assert.equal(registry.pages('v1.0'), mockContents['github-upload']['v1.0'].customPages);
        });

        it('can be saved to a file', function() {
            var registryFilePath = 'test/tmp';
            registry.save(registryFilePath);

            var savedRegistryData = js.readFileSync(registryFilePath + '/syncRegistry.json');
            var savedRegistry = new Registry(savedRegistryData);

            assert.deepEqual(registry.export(), savedRegistry.export());

            fs.unlinkSync(registryFilePath + '/syncRegistry.json');
        });
    });

    describe('content aggregation', function() {
        before(function() {
            registry = new Registry(mockContents);
        });

        it('can pull documentation categories', function() {
            assert.lengthOf(registry.allDocCategories(), 4);
        });

        it('can pull together all the docs', function() {
            var versions = {};
            var allDocs = registry.allDocs();

            assert.lengthOf(allDocs, 7);
            allDocs.forEach(function(doc) {
                versions[doc.version] = versions[doc.version] + 1 || 1;
            });

            assert.equal(versions['v1.0'], 3);
            assert.equal(versions['v2.0'], 4);
        });
    });
});
