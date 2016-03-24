'use strict';

var assert = require('chai').assert;
var nock = require('nock');
var js = require('jsonfile');
var fs = require('fs');

var UrlGenerator = require('../lib/urlGenerator');
var Requestor = require('../lib/requestor');
var RegistryBuilder = require('../lib/registryBuilder');
var requestor;

var projectName = 'github-upload';
var resources = [{ version: 'v1.0'}, { version: 'v2.0' }];
var urlGen1 = new UrlGenerator(projectName, 'v1.0');
var urlGen2 = new UrlGenerator(projectName, 'v2.0');

describe('Requestor', function() {
    it('is constructed with resources + cookie', function() {
        requestor = new Requestor(projectName, 'cookie');

        assert.equal(requestor.projectName, projectName);
        assert.equal(requestor.cookie, 'cookie');
    });

    describe('get', function() {
        it('can request custom content', function(done) {
            requestor = new Requestor(projectName, 'cookie');

            nock(urlGen1.base()).get(urlGen1.contentGetPath()).reply(200, js.readFileSync('test/fixtures/content-v1.json'));
            nock(urlGen2.base()).get(urlGen2.contentGetPath()).reply(200, js.readFileSync('test/fixtures/content-v2.json'));

            requestor.customContent(resources, function(content) {
                assert.isDefined(content['v1.0'].appearance.html_body);
                assert.isDefined(content['v2.0'].appearance.stylesheet);

                done();
            });
        });

        it('can request documentation', function(done) {
            requestor = new Requestor(projectName, 'cookie');

            nock(urlGen1.base()).get(urlGen1.docsGetPath()).reply(200, js.readFileSync('test/fixtures/docs-v1.json'));
            nock(urlGen2.base()).get(urlGen2.docsGetPath()).reply(200, js.readFileSync('test/fixtures/docs-v2.json'));

            requestor.documentation(resources, function(documentation) {
                assert.lengthOf(documentation['v2.0'], 2);

                done();
            });
        });

        it('can request customPages', function(done) {
            requestor = new Requestor(projectName, 'cookie');

            nock(urlGen1.base()).get(urlGen1.pagesGetPath()).reply(200, js.readFileSync('test/fixtures/pages-v1.json'));
            nock(urlGen2.base()).get(urlGen2.pagesGetPath()).reply(200, js.readFileSync('test/fixtures/pages-v2.json'));

            requestor.customPages(resources, function(customPages) {
                assert.lengthOf(customPages['v2.0'], 2);

                done();
            });
        });

        it('can request versions', function(done) {
            requestor = new Requestor(projectName, 'cookie');

            var scope = nock(urlGen1.base());
            scope.get(urlGen1.versionsGetPath()).reply(200, fs.readFileSync('test/fixtures/project-versions.json'));

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
            registry = RegistryBuilder.build(js.readFileSync('test/fixtures/syncPaths.json'));
        });

        it('can post/put new doc categories', function(done) {
            // Create network request mocks
            var postResponse = js.readFileSync('test/fixtures/doc-category-post.json');
            var scope = nock(urlGen1.base());

            registry.allDocCategories().forEach(function(category) {
                category.method = category.slug ? 'put' : 'post';
                var urlFn = category.slug ? 'docCategoriesPutPath' : 'docCategoriesPostPath';
                var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;

                scope[category.method](urlGen[urlFn](category.slug), { title: category.title }).reply(200, postResponse);
            });

            // Make requests
            requestor = new Requestor(projectName, 'cookie');
            requestor.uploadDocCategories(registry.allDocCategories(), function(uploadedCategories) {
                assert.lengthOf(uploadedCategories, 4);

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
                doc.method = doc.slug ? 'put' : 'post';
                var urlFn = doc.slug ? 'docsPutPath' : 'docsPostPath';
                var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
                var slug = doc.slug || doc.categorySlug;

                var requestBody = { title: doc.title, excerpt: doc.excerpt, body: fs.readFileSync(doc.body).toString() };
                scope[doc.method](urlGen[urlFn](slug), requestBody).reply(200, postResponse);
            });

            // Make requests
            requestor.uploadDocs(registry.allDocs(), function(uploadedDocs) {
                assert.lengthOf(uploadedDocs, 8);

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
                page.method = page.slug ? 'put' : 'post';
                var urlFn = page.slug ? 'pagesPutPath' : 'pagesPostPath';
                var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;

                var requestBody = { title: page.title, html: fs.readFileSync(page.html).toString(), htmlmode: true, fullscreen: true, body: 'body' };
                scope[page.method](urlGen[urlFn](page.slug), requestBody).reply(200, postResponse);
            });

            requestor.uploadPages(registry.allCustomPages(), function(uploadedPages) {
                assert.lengthOf(uploadedPages, 8);

                registry.allCustomPages().forEach(function(page) {
                    assert.equal(page.title, postResponse.title);
                    assert.equal(page.slug, postResponse.slug);
                    assert.isUndefined(page.subdomain);
                    assert.equal(fs.readFileSync(page.html).toString(), postResponse.html);
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

            requestor.uploadContent(registry.allCustomContent(), function(uploadedContent) {
                assert.lengthOf(uploadedContent, 2);
                assert.isTrue(scope.isDone());
                done();
            });
        });

    });

    describe('delete', function() {
        var registry;

        beforeEach(function() {
            registry = RegistryBuilder.build(js.readFileSync('test/fixtures/syncPaths.json'));
        });

        it('can delete docs', function(done) {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allDocs().forEach(function(doc) {
                var urlGen = doc.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.docsDeletePath(doc.slug)).reply(200, deleteResponse);
            });

            requestor.deleteDocs(registry.allDocs(), function(deleteResults) {
                var failed = deleteResults.filter(function(result) { return !!result.error; });

                assert.lengthOf(failed, 0);

                assert.isTrue(scope.isDone());
                done();
            });
        });

        it('can delete doc categories', function(done) {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allDocCategories().forEach(function(category) {
                var urlGen = category.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.docCategoriesDeletePath(category.slug)).reply(200, deleteResponse);
            });

            requestor.deleteDocCategories(registry.allDocCategories(), function(deleteResults) {
                var failed = deleteResults.filter(function(result) { return !!result.error; });

                assert.lengthOf(failed, 0);
                assert.isTrue(scope.isDone());
                done();
            });

        });

        it('can delete custom pages', function(done) {
            var deleteResponse = js.readFileSync('test/fixtures/delete.json');
            var scope = nock(urlGen1.base());

            registry.allCustomPages().forEach(function(page) {
                var urlGen = page.version === 'v1.0' ? urlGen1 : urlGen2;
                scope.delete(urlGen.pagesDeletePath(page.slug)).reply(200, deleteResponse);
            });

            requestor.deletePages(registry.allCustomPages(), function(deleteResults) {
                var failed = deleteResults.filter(function(result) { return !!result.error; });
                assert.lengthOf(failed, 0);

                assert.isTrue(scope.isDone());
                done();
            });
        });
    });

    describe('order', function() {
        var registry;

        beforeEach(function() {
            registry = RegistryBuilder.build(js.readFileSync('test/fixtures/syncPaths.json'));
        });

        it('can upload doc categories order', function(done) {
            var scope = nock(urlGen1.base());
            var requestBodies = { 'v1.0': {}, 'v2.0': {} };

            registry.allDocCategories().forEach(function(category) {
                requestBodies[category.version][category._id] = category.order;
            });

            scope.post(urlGen1.docCategoriesOrderPath(), requestBodies['v1.0']).reply(200, {});
            scope.post(urlGen2.docCategoriesOrderPath(), requestBodies['v2.0']).reply(200, {});

            requestor.uploadDocCategoriesOrder(registry.allDocCategories(), function(results) {
                for (var version in results) {
                    if (results.hasOwnProperty(version)) { assert.isTrue(results[version]); }
                }
                assert.isTrue(scope.isDone());

                done();
            });
        });

        it('can upload doc order', function(done) {
            var scope = nock(urlGen1.base());
            var requestBodies = { 'v1.0': [], 'v2.0': [] };

            registry.allDocCategories().forEach(function(category) {
                category._id = Math.floor(Math.random() * 10000);
            });

            registry.allDocs().forEach(function(doc) {
                doc._id = Math.floor(Math.random() * 10000);
                requestBodies[doc.version].push({ id: doc._id, category: doc.categoryId, parentPage: null, order: doc.order });
            });

            scope.post(urlGen1.docsOrderPath(), requestBodies['v1.0']).reply(200, {});
            scope.post(urlGen2.docsOrderPath(), requestBodies['v2.0']).reply(200, {});

            requestor.uploadDocsOrder(registry.allDocs(), function(results) {
                for (var version in results) {
                    if (results.hasOwnProperty(version)) { assert.isTrue(results[version]); }
                }
                assert.isTrue(scope.isDone());

                done();
            });
        });
    });
});
