'use strict';

var assert = require('chai').assert;
var Registry = require('../lib/registry');
var js = require('jsonfile');

var mockContents;
var registry;

describe('Registry', function() {
    before(function() {
        mockContents = js.readFileSync('test/fixtures/readmeContent.json');
    });

    it('builds a skeleton when constructed', function() {
        registry = new Registry('github-upload', ['v1.0', 'v2.0']);
        var registrySkeleton = {
            'github-upload': {
                'v1.0': {},
                'v2.0': {}
            }
        };

        assert.deepEqual(registry.export(), registrySkeleton);
    });

    it('can set its contents', function() {
        registry = new Registry('other-project', ['v5.0']);

        registry.import(mockContents);

        assert.equal(registry.projectName, 'github-upload');
        assert.deepEqual(registry.versions, ['v2.0', 'v1.0']);
        assert.equal(registry.export(), mockContents);
    });

    it('can add versions', function() {
        registry = new Registry('github-upload');
        var expectedRegistry = {
            'github-upload': {
                'v1.0': {},
                'v2.0': {},
                'v3.0': {}
            }
        };

        registry.addVersion('v1.0');
        registry.addVersions(['v2.0', 'v3.0']);

        assert.deepEqual(registry.export(), expectedRegistry);
    });

    describe('contents', function() {
        before(function() {
            registry = new Registry();
            registry.import(mockContents);
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
    });

    describe('content aggregation', function() {
        before(function() {
            registry = new Registry();
            registry.import(mockContents);
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
