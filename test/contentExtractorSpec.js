'use strict';

var assert = require('chai').assert;
var js = require('jsonfile');
var fs = require('fs');

var Registry = require('../lib/registry');
var ContentExtractor = require('../lib/contentExtractor');

var registry;
describe('ContentExtractor', function() {
    before(function(){
        registry = new Registry();
    })

    it('is constructed with a output path and registry', function() {
        var registryData = { 'github-upload': { 'v1.0': 'versions', 'v2.0': 'versions' }};
        registry.import(registryData);

        var extractor = new ContentExtractor('test/tmp', registry);

        assert.equal(extractor.outputPath, 'test/tmp');
        assert.equal(extractor.registry, registry);
        assert.deepEqual(extractor.versions, ['v1.0', 'v2.0']);
    });

    it('can generate file paths for documents', function() {
        registry.import({
            'github-upload': {
                'v1.0': {}
            }
        });
        var extractor = new ContentExtractor('test/tmp', registry);

        assert.equal(extractor.docPath('v1.0', 'category', 'title'), 'test/tmp/github-upload/v1.0/documentation/category/title.md');
    });

    it('extracts documentation content', function(done) {
        js.readFile('test/fixtures/readmeContent.json', function(err, registryData) {
            assert.isNull(err);

            registry.import(registryData);
            var extractor = new ContentExtractor('test/tmp', registry);

            extractor.documentation(function(linkedRegistry) {
                var docs = linkedRegistry.docs('v1.0');

                docs.forEach(function(category) {
                    category.pages.forEach(function(page) {
                        var docPath = extractor.docPath('v1.0', category.title, page.title);
                        assert.equal(page.body, docPath);
                        assert.isTrue(fs.existsSync(docPath));
                    });
                });

                done();
            });
        });

    });

    it('extracts custom page content', function(done) {
        js.readFile('test/fixtures/readmeContent.json', function(err, registryData) {
            assert.isNull(err);

            registry.import(registryData);
            var extractor = new ContentExtractor('test/tmp', registry);

            extractor.customPages(function(linkedRegistry) {
                var customPages = linkedRegistry.pages('v1.0');

                customPages.forEach(function(page) {
                    var pagePath = extractor.pagePath('v1.0', page.title);

                    assert.equal(page.html, pagePath);
                    assert.isTrue(fs.existsSync(pagePath));
                });

                done();
            });
        });
    });

    it('extracts custom content', function(done) {
        js.readFile('test/fixtures/readmeContent.json', function(err, registryData) {
            assert.isNull(err);

            registry.import(registryData);
            var extractor = new ContentExtractor('test/tmp', registry);

            extractor.customContent(function(linkedRegistry) {
                var customContent = linkedRegistry.content('v1.0').appearance;

                var contentPaths = extractor.contentPaths('v1.0');

                assert.equal(customContent.html_body, contentPaths.html_body);
                assert.equal(customContent.stylesheet, contentPaths.stylesheet);

                assert.isTrue(fs.existsSync(customContent.html_body));
                assert.isTrue(fs.existsSync(customContent.stylesheet));

                done();
            });
        });
    });
});
