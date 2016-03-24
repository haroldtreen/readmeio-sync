'use strict';

var js = require('jsonfile');
var fs = require('fs');

var config = require('../../lib/config');
var UrlGenerator = require('../../lib/urlGenerator');
var utils = require('../../lib/utils');


var RequestMocker = function(registry) {
    this.registry = registry;
    this.urlGen1 = new UrlGenerator(config.projectName, 'v1.0');
    this.urlGen2 = new UrlGenerator(config.projectName, 'v2.0');
};

RequestMocker.fixtures = {
    projectVersions: 'test/fixtures/project-versions.json',
    doc: function(version) { return 'test/fixtures/doc-v' + version + '.json'; },
    pages: function(version) { return 'test/fixtures/pages-v' + version + '.json'; },
    content: function(version) { return 'test/fixtures/content-v' + version + '.json'; }
};

RequestMocker.prototype.mockVersionDownload = function(scope) {
    scope.get(this.urlGen1.versionsGetPath()).reply(200, js.readFileSync('test/fixtures/project-versions.json'));
    return scope;
};

RequestMocker.prototype.mockRemoteRegistryDownload = function(scope) {
    var self = this;
    ['docsGet', 'contentGet', 'pagesGet'].forEach(function(section) {
        scope.get(self.urlGen1[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v1.json'));
        scope.get(self.urlGen2[section + 'Path']()).reply(200, js.readFileSync('test/fixtures/' + section + '-v2.json'));
    });
    return scope;
};

RequestMocker.prototype.mockDocCategoriesUpload = function(scope, remoteRegistry) {
    var self = this;
    var diff = this.registry.diff(remoteRegistry);
    var postResponse = js.readFileSync('test/fixtures/doc-category-post.json');

    self.registry.allDocCategories().forEach(function(category) {
        var isAdded = diff.isAdded('allDocCategories', { slug: category.slug, version: category.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = isAdded ? 'docCategoriesPostPath' : 'docCategoriesPutPath';
        var urlGen = category.version === 'v1.0' ? self.urlGen1 : self.urlGen2;

        scope[requestFn](urlGen[urlFn](category.slug), { title: category.title }).reply(200, postResponse);
    });
    return scope;
};

RequestMocker.prototype.mockDocsUpload = function(scope, remoteRegistry) {
    var self = this;
    var diff = this.registry.diff(remoteRegistry);

    // Create network request mocks
    self.registry.allDocs().forEach(function(doc) {
        var postResponse = js.readFileSync('test/fixtures/doc-post.json');
        var isAdded = diff.isAdded('allDocs', { slug: doc.slug, version: doc.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = doc.slug ? 'docsPostPath' : 'docsPutPath';
        var urlGen = doc.version === 'v1.0' ? self.urlGen1 : self.urlGen2;
        var slug = isAdded ? doc.categorySlug : doc.slug;

        var requestBody = { title: doc.title, excerpt: doc.excerpt, body: utils.mdToReadme(utils.mdBody(fs.readFileSync(doc.body).toString())) };

        scope[requestFn](urlGen[urlFn](slug), requestBody).reply(200, postResponse);

        if (requestFn === 'post' && doc.slug && doc.slug !== postResponse.slug) {
            var url = urlGen.docsPutPath(postResponse.slug);
            postResponse.slug = doc.slug;
            scope.put(url, JSON.stringify(postResponse)).reply(200, postResponse);
        }
    });
    return scope;
};

RequestMocker.prototype.mockPagesUpload = function(scope, remoteRegistry) {
    var self = this;
    var diff = self.registry.diff(remoteRegistry);
    var postResponse = js.readFileSync('test/fixtures/custom-page-post.json');

    self.registry.allCustomPages().forEach(function(page) {
        var isAdded = diff.isAdded('allCustomPages', { slug: page.slug, version: page.version });
        var requestFn = isAdded ? 'post' : 'put';
        var urlFn = isAdded ? 'pagesPostPath' : 'pagesPutPath';
        var urlGen = page.version === 'v1.0' ? self.urlGen1 : self.urlGen2;

        var requestBody = { title: page.title, html: fs.readFileSync(page.html).toString(), htmlmode: true, fullscreen: true, body: 'body' }; //, version: page.version.replace('v', ''), subdomain: 'github-upload' };
        scope[requestFn](urlGen[urlFn](page.slug), requestBody).reply(200, postResponse);
    });
    return scope;
};

RequestMocker.prototype.mockContentUpload = function(scope) {
    var self = this;
    var putResponse = js.readFileSync('test/fixtures/content-put.json');

    self.registry.allCustomContent().forEach(function(content) {
        var appearance = content.appearance;
        var urlGen = content.version === 'v1.0' ? self.urlGen1 : self.urlGen2;
        var requestBody = { appearance: { html_body: fs.readFileSync(appearance.html_body).toString(), stylesheet: fs.readFileSync(appearance.stylesheet).toString() }};
        scope.put(urlGen.contentPutPath(), requestBody).reply(200, putResponse);
    });
    return scope;
};

RequestMocker.prototype.mockDocsOrderUpload = function(scope) {
    var self = this;
    var categoryRequestBody;
    var urlGen;

    self.registry.versions.forEach(function(version) {
        categoryRequestBody = {};
        self.registry.docs(version).forEach(function(category, index) {
            categoryRequestBody[category._id] = index;
        });

        urlGen = version === 'v1.0' ? self.urlGen1 : self.urlGen2;
        scope.post(urlGen.docCategoriesOrderPath()).reply(200, {});
    });

    var requestBodies = { 'v1.0': [], 'v2.0': [] };

    self.registry.allDocCategories().forEach(function(category) {
        category._id = Math.floor(Math.random() * 10000);
    });

    self.registry.allDocs().forEach(function(doc) {
        doc._id = Math.floor(Math.random() * 10000);
        requestBodies[doc.version].push({ id: doc._id, category: doc.categoryId, parentPage: null, order: doc.order });
    });

    scope.post(self.urlGen1.docsOrderPath(), requestBodies['v1.0']).reply(200, {});
    scope.post(self.urlGen2.docsOrderPath(), requestBodies['v2.0']).reply(200, {});

    return scope;
};

module.exports = RequestMocker;
