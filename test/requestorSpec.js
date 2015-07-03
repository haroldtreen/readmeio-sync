'use strict';

var assert = require('chai').assert;
var nock = require('nock');
var js = require('jsonfile');
var fs = require('fs');

var UrlGenerator = require('../lib/urlGenerator');
var Requestor = require('../lib/requestor');
var Registry = require('../lib/registry');

var requestor;

var projectName = 'github-upload';
var resources = [{ version: 'v1.0'}, { version: 'v2.0' }];
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var urlGen2 = new UrlGenerator(projectName, 'v2.0');

describe('Requestor', function() {
    it('is constructed with resources + cookie', function() {
        requestor = new Requestor('cookie', projectName);

        assert.equal(requestor.projectName, projectName);
        assert.equal(requestor.cookie, 'cookie');
    });

    it('caches request responses', function(done) {
        requestor = new Requestor('cookie', projectName);

        var scope = nock(urlGen1.base());
        scope.get(urlGen1.contentPath()).reply(200, js.readFileSync('test/fixtures/content-v1.json'));
        scope.get(urlGen2.contentPath()).reply(200, js.readFileSync('test/fixtures/content-v2.json'));

        scope.get(urlGen1.contentPath()).reply(200, '{ "github-upload": { "v1.0": { "customContent": "bleh" }}}');
        scope.get(urlGen2.contentPath()).reply(200, '{ "github-upload": { "v2.0": { "customContent": "bleh" }}}');

        requestor.customContent(resources, function(response1) {
            requestor.customContent(resources, function(response2) {
                assert.equal(JSON.stringify(response1), JSON.stringify(response2));

                nock.cleanAll();

                done();
            });
        });
    });

    describe('get', function() {
        it('can request custom content', function(done) {
            requestor = new Requestor('cookie', projectName);

            nock(urlGen1.base()).get(urlGen1.contentPath()).reply(200, js.readFileSync('test/fixtures/content-v1.json'));
            nock(urlGen2.base()).get(urlGen2.contentPath()).reply(200, js.readFileSync('test/fixtures/content-v2.json'));

            requestor.customContent(resources, function(content) {
                assert.isDefined(content[projectName]['v1.0'].customContent.appearance.html_body);
                assert.isDefined(content[projectName]['v2.0'].customContent.appearance.stylesheet);

                done();
            });
        });

        it('can request documentation', function(done) {
            requestor = new Requestor('cookie', projectName);

            nock(urlGen1.base()).get(urlGen1.docsPath()).reply(200, js.readFileSync('test/fixtures/docs-v1.json'));
            nock(urlGen2.base()).get(urlGen2.docsPath()).reply(200, js.readFileSync('test/fixtures/docs-v2.json'));

            requestor.documentation(resources, function(documentation) {
                assert.isDefined(documentation[projectName]['v1.0'].documentation);
                assert.lengthOf(documentation[projectName]['v2.0'].documentation, 2);

                done();
            });
        });

        it('can request customPages', function(done) {
            requestor = new Requestor('cookie', projectName);

            nock(urlGen1.base()).get(urlGen1.pagesPath()).reply(200, js.readFileSync('test/fixtures/pages-v1.json'));
            nock(urlGen2.base()).get(urlGen2.pagesPath()).reply(200, js.readFileSync('test/fixtures/pages-v2.json'));

            requestor.customPages(resources, function(documentation) {
                assert.isDefined(documentation[projectName]['v1.0'].customPages);
                assert.lengthOf(documentation[projectName]['v2.0'].customPages, 2);

                done();
            });
        });

        it('can request versions', function(done) {
            requestor = new Requestor('cookie', projectName);

            var scope = nock(urlGen1.base());
            scope.get(urlGen1.versionsPath()).reply(200, fs.readFileSync('test/fixtures/project-versions.json'));

            requestor.versions(function(versions) {
                assert.lengthOf(versions, 2);
                scope.done();
                done();
            });

        });
    });

    describe('post/put', function() {
        var registry;

        beforeEach(function() {
            registry = new Registry(js.readFileSync('test/fixtures/syncRegistry.json'));
        });

        it('can post/put new doc categories', function(done) {
            // Create network request mocks
            var postResponse = js.readFileSync('test/fixtures/doc-category-post.json');
            var scope = nock(urlGen1.base());

            registry.allDocCategories().forEach(function(category) {
                var requestFn = category.slug ? 'put' : 'post';
                var urlFn = category.slug ? 'docCategoriesPutPath' : 'docCategoriesPostPath';
                var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;

                scope[requestFn](urlGen[urlFn](category.slug), { title: category.title }).reply(200, postResponse);
            });

            // Make requests
            requestor = new Requestor('cookie', projectName);
            requestor.uploadDocCategories(registry.allDocCategories(), function(failedUploads) {
                assert.lengthOf(failedUploads, 0);

                registry.allDocCategories().forEach(function(category) {
                    assert.equal(category.title, postResponse.title);
                    assert.equal(category.slug, postResponse.slug);
                });
                done();
            });


        });

        it('can post/put new docs', function(done) {
            // Create network request mocks
            var postResponse = js.readFileSync('test/fixtures/doc-post.json');
            var scope = nock(urlGen1.base());

            registry.allDocs().forEach(function(doc) {
                var requestFn = doc.slug ? 'put' : 'post';
                var urlFn = doc.slug ? 'docsPutPath' : 'docsPostPath';
                var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
                var slug = doc.slug || doc.categorySlug;

                var requestBody = { title: doc.title, excerpt: doc.excerpt, body: fs.readFileSync(doc.body).toString(), type: doc.type };
                scope[requestFn](urlGen[urlFn](slug), requestBody).reply(200, postResponse);
            });

            // Make requests
            requestor.uploadDocs(registry.allDocs(), function(failedUploads) {
                assert.lengthOf(failedUploads, 0);

                registry.allDocs().forEach(function(doc) {
                    assert.equal(doc.title, postResponse.title);
                    assert.equal(doc.slug, postResponse.slug);
                    assert.equal(doc.excerpt, postResponse.excerpt);
                });

                assert.isTrue(scope.isDone());
                done();
            });
        });

        it('can post/put new custom pages', function(done) {
            var postResponse = js.readFileSync('test/fixtures/custom-page-post.json');
            var scope = nock(urlGen1.base());

            registry.allCustomPages().forEach(function(page) {
                var requestFn = page.slug ? 'put' : 'post';
                var urlFn = page.slug ? 'pagesPutPath' : 'pagesPostPath';
                var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;

                var requestBody = { title: page.title, html: fs.readFileSync(page.html).toString(), htmlmode: true, fullscreen: true, body: 'body' }; //, version: page.version.replace('v', ''), subdomain: 'github-upload' };
                scope[requestFn](urlGen[urlFn](page.slug), requestBody).reply(200, postResponse);
            });

            requestor.uploadPages(registry.allCustomPages(), function(failedUploads) {
                assert.lengthOf(failedUploads, 0);

                registry.allCustomPages().forEach(function(page) {
                    assert.equal(page.title, postResponse.title);
                    assert.equal(page.slug, postResponse.slug);
                    assert.isUndefined(page.subdomain);
                    assert.equal(fs.readFileSync(page.body).toString(), postResponse.body);
                });

                assert.isTrue(scope.isDone());
                done();
            });
        });

        it('can post/put custom content', function(done) {
            var putResponse = js.readFileSync('test/fixtures/content-put.json');
            var scope = nock(urlGen1.base());

            registry.allCustomContent().forEach(function(content) {
                var appearance = content.appearance;
                var urlGen = content.version === 'v1.0' ? urlGen1 : urlGen2;
                var requestBody = { appearance: { html_body: fs.readFileSync(appearance.html_body).toString(), stylesheet: fs.readFileSync(appearance.stylesheet).toString()}};
                scope.put(urlGen.contentPutPath(), requestBody).reply(200, putResponse);
            });

            requestor.uploadContent(registry.allCustomContent(), function(failedUploads) {
                assert.lengthOf(failedUploads, 0);
                assert.isTrue(scope.isDone());
                done();
            });
        });

    });

    describe('delete', function() {
        var registry;

        beforeEach(function() {
            registry = new Registry(js.readFileSync('test/fixtures/syncRegistry.json'));
        });

        it('can delete docs', function() {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allDocs().forEach(function(doc) {
                var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.docsDeletePath(doc.slug)).reply(200, deleteResponse);
            });

            requestor.deleteDocs(registry.allDocs(), function(failedDeletes) {
                assert.lengthOf(failedDeletes, 0);

                assert.isTrue(scope.isDone());
            });
        });

        it('can delete doc categories', function(done) {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allDocCategories().forEach(function(category) {
                var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.docCategoriesDeletePath(category.slug)).reply(200, deleteResponse);
            });

            requestor.deleteDocCategories(registry.allDocCategories(), function(failedDeletes) {
                assert.lengthOf(failedDeletes, 0);
                assert.isTrue(scope.isDone());
                done();
            });

        });

        it('can delete custom pages', function() {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allCustomPages().forEach(function(page) {
                var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.pagesDeletePath(page.slug)).reply(200, deleteResponse);
            });

            requestor.deletePages(registry.allCustomPages(), function(failedDeletes) {
                assert.lengthOf(failedDeletes, 0);

                assert.isTrue(scope.isDone());
            });
        });

    });
});


