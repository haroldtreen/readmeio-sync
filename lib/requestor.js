'use strict';

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var async = require('async');

var config = require('./config');
var UrlGenerator = require('./urlGenerator');

var Requestor = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;
    this.cache = {};
    this.cache[projectName] = {};
};

/*
    HELPERS
    ******************
*/

var handleError = function(err, description) {
    throw new Error(description + err);
};

/*
    FILTERS
    ******************
*/

// Used to determine if the resource should remain in the array of failures
var filterAsyncResult = function(failedResource) {
    return !!failedResource;
};

// Filters unwanted data from the page response.
var filterPageData = function(category) {
    return category.pages.map(function(page) {
        return {
            _id: page._id,
            body: page.body,
            excerpt: page.excerpt,
            title: page.title,
            slug: page.slug,
            type: page.type
        };
    });
};


// Filters unwanted information from the category response and filters the page data.
var filterCategoryData = function(category) {
    return {
        _id: category._id,
        slug: category.slug,
        title: category.title,
        pages: filterPageData(category)
    };
};


// Creates an array of filtered document objects
var filterDocData = function(docs) {
    return docs.map(function(category) {
        return filterCategoryData(category);
    });
};


// Filters out unwanted fields from the page response.
var filterCustomPage = function(page) {
    return {
        title: page.title,
        body: page.body,
        html: page.html,
        slug: page.slug
    };
};


// Creates array of filtered page data objects.
var filterCustomPages = function(pages) {
    return pages.map(function(page) {
        return filterCustomPage(page);
    });
};


// Filters everything but the custom content we care about.
var filterContent = function(customContent) {
    var appearance = customContent.appearance;

    return {
        appearance: {
            html_body: appearance.html_body,
            stylesheet: appearance.stylesheet
        }
    };
};

var filterVersions = function(versions) {
    return versions.map(function(version) {
        return { version: 'v' + version.version };
    });
};

/*
    GET REQUEST FUNCTIONS
    **********************
*/

// Checks if the requested resource has been already downloaded
Requestor.prototype.isCached = function(resource, subSection) {
    return _.has(this.cache, [this.projectName, resource.version, subSection]);
};


Requestor.prototype.buildResourceToGetRequestFn = function(subSection, filterFn, urlFn) {
    var self = this;

    var resourceToRequestFn = function(resource) {
        var versionCache = self.cache[self.projectName][resource.version];
        if (!versionCache) {
            versionCache = self.cache[self.projectName][resource.version] = {};
        }

        var requestFn = function(callback) {
            var urlGen = new UrlGenerator(self.projectName, resource.version);

            // Always using the cache for our base registry
            if (self.isCached(resource, subSection)) {
                callback(null, self.cache);
            }

            config.log('Request: get @ ' + urlGen[urlFn]());
            request.get({ url: urlGen[urlFn](), jar: self.cookie }, function(err, response, body) {
                if (err) {
                    callback(err, null);
                }

                versionCache[subSection] = filterFn(JSON.parse(body));
                callback(null, self.cache);
            });
        };
        return requestFn;
    };

    return resourceToRequestFn;
};


// Fetches documentation data for each version of the project
Requestor.prototype.documentation = function(resources, cb) {
    var self = this;
    var resourceToRequestConverter = this.buildResourceToGetRequestFn('documentation', filterDocData, 'docsUrl');
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err) {
        if (err) {
            handleError(err, 'Docs failed to download: ');
        } else {
            cb(self.cache);
        }
    });
};


// Fetches the data for custom pages for each version
Requestor.prototype.customPages = function(resources, cb) {
    var self = this;
    var resourceToRequestConverter = this.buildResourceToGetRequestFn('customPages', filterCustomPages, 'pagesUrl');
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err) {
        if (err) {
            handleError(err, 'Custom pages failed to download: ');
        } else {
            cb(self.cache);
        }
    });
};


// Fetches content like custom landing html and stylesheet data for each version
Requestor.prototype.customContent = function(resources, cb) {
    var self = this;
    var resourceToRequestConverter = this.buildResourceToGetRequestFn('customContent', filterContent, 'contentUrl');
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err) {
        if (err) {
            handleError(err, 'Custom content failed to download: ');
        } else {
            cb(self.cache);
        }
    });
};

/*
    Downloads the version data for the project
*/
Requestor.prototype.versions = function(cb) {
    var urlGen = new UrlGenerator(this.projectName);

    request.get({ url: urlGen.versionsUrl(), jar: this.cookie }, function(err, response, body) {
        if (err) {
            handleError(err, 'Versions could not be downloaded:\n');
        } else {
            var versions = filterVersions(JSON.parse(body));
            cb(versions);
        }
    });
};


/*
    POST/PUT REQUEST FUNCTIONS
    ***************************
*/
Requestor.prototype.buildResourceToUploadRequestFn = function(createBodyFn, urlFns) {
    var self = this;

    var uploadResource = function(resource, requestCb) {
        var requestSettings = {};
        var urlGen = new UrlGenerator(self.projectName, resource.version);

        var putUrl = urlGen[urlFns.put](resource.slug);
        var postUrl = urlGen[urlFns.post](resource.categorySlug);

        requestSettings.method = resource.method || 'put';
        requestSettings.url = resource.method === 'put' ? putUrl : postUrl;
        requestSettings.headers = {'Content-Type': 'application/json' };
        requestSettings.jar = self.cookie;
        requestSettings.body = createBodyFn(resource);

        config.log('Request: ' + requestSettings.method + ' @ ' + requestSettings.url);

        request(requestSettings, requestCb);
    };

    var resourceToRequestFn = function(resource) {
        var requestFn = function(callback) {
            uploadResource(resource, function(err, response, body) {
                if (err) {
                    console.log(err);
                    callback(null, resource);
                } else if (response.statusCode !== 200) {
                    console.log('Bad Error Code: ' + response.statusCode);
                    console.log('Body: ' + body);
                    callback(null, resource);
                } else {
                    var respBody = JSON.parse(body);
                    resource.title = respBody.title;
                    resource.slug = respBody.slug;
                    resource.excerpt = respBody.excerpt;
                    resource._id = respBody._id;
                    callback(null, false);
                }
            });
        };
        return requestFn;
    };

    return resourceToRequestFn;
};


// Uploads categories used to group pages of documentation.
Requestor.prototype.uploadDocCategories = function(resources, cb) {
    var urlFns = { post: 'docCategoriesPostUrl', put: 'docCategoriesPutUrl' };
    var createBodyFn = function(resource) {
        return JSON.stringify({ title: resource.title });
    };
    var resourceToRequestConverter = this.buildResourceToUploadRequestFn(createBodyFn, urlFns);
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Doc Categories failed to upload: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};


Requestor.prototype.uploadDocs = function(resources, cb) {
    var urlFns = { post: 'docsPostUrl', put: 'docsPutUrl' };
    var createBodyFn = function(resource) {
        return JSON.stringify({
            title: resource.title,
            excerpt: resource.excerpt,
            body: fs.readFileSync(resource.body).toString(),
            type: resource.type
        });
    };
    var resourceToRequestConverter = this.buildResourceToUploadRequestFn(createBodyFn, urlFns);
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Docs failed to upload: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

Requestor.prototype.uploadPages = function(resources, cb) {
    var urlFns = { post: 'pagesPostUrl', put: 'pagesPutUrl' };
    var createBodyFn = function(resource) {
        var html = fs.readFileSync(resource.html).toString();
        if (resource.selector) {
            var $ = cheerio.load(html);
            html = $(resource.selector).html();
        }

        return JSON.stringify({
            fullscreen: true,
            htmlmode: true,
            title: resource.title,
            html: html,
            body: 'body'
        });
    };
    var resourceToRequestConverter = this.buildResourceToUploadRequestFn(createBodyFn, urlFns);
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Pages failed to upload: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

Requestor.prototype.uploadContent = function(resources, cb) {
    var urlFns = { post: 'contentPutUrl', put: 'contentPutUrl' }; //Content only needs put
    var createBodyFn = function(resource) {
        var html = fs.readFileSync(resource.appearance.html_body).toString();
        if (resource.selector) {
            var $ = cheerio.load(html);
            html = $(resource.selector).html();
        }

        return JSON.stringify({
            appearance: {
                html_body: html,
                stylesheet: fs.readFileSync(resource.appearance.stylesheet).toString()
            }
        });
    };
    var resourceToRequestConverter = this.buildResourceToUploadRequestFn(createBodyFn, urlFns);
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Custom content failed to upload: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

/*
    DELETE REQUEST FUNCTIONS
    ***************************
*/
Requestor.prototype.buildResourceToDeleteRequestFn = function(urlFn) {
    var self = this;

    var deleteResource = function(resource, requestCb) {
        var requestSettings = {};
        var urlGen = new UrlGenerator(self.projectName, resource.version);

        requestSettings.method = 'DELETE';
        requestSettings.url = urlGen[urlFn](resource.slug);
        requestSettings.jar = self.cookie;

        config.log('Request: ' + requestSettings.method + ' @ ' + requestSettings.url);
        request(requestSettings, requestCb);
    };

    var resourceToRequestFn = function(resource) {
        var requestFn = function(callback) {
            deleteResource(resource, function(err, response, body) {
                if (err) {
                    console.log(err);
                    callback(null, resource);
                } else if (response.statusCode !== 200) {
                    console.log('Bad Error Code: ' + response.statusCode);
                    console.log('Body: ' + body);
                    callback(null, resource);
                } else {
                    callback(null, null);
                }
            });
        };
        return requestFn;
    };

    return resourceToRequestFn;
};

Requestor.prototype.deleteDocs = function(resources, cb) {
    var resourceToRequestConverter = this.buildResourceToDeleteRequestFn('docsDeleteUrl');
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Docs failed to delete: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

Requestor.prototype.deleteDocCategories = function(resources, cb) {
    var resourceToRequestConverter = this.buildResourceToDeleteRequestFn('docCategoriesDeleteUrl');

    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Docs failed to delete: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

Requestor.prototype.deletePages = function(resources, cb) {
    var resourceToRequestConverter = this.buildResourceToDeleteRequestFn('pagesDeleteUrl');
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, 10, function(err, results) {
        if (err) {
            handleError(err, 'Docs failed to delete: ');
        } else {
            cb(results.filter(filterAsyncResult));
        }
    });
};

/*
    ORDER REQUEST FUNCTIONS
    ***************************
*/

Requestor.prototype.uploadDocCategoriesOrder = function(resources, cb) {
    var self = this;
    var requestBodies = {};

    resources.forEach(function(category) {
        requestBodies[category.version] = requestBodies[category.version] || {};
        requestBodies[category.version][category._id] = category.order;
    });

    var requestFns = Object.keys(requestBodies).map(function(version) {
        var urlGen = new UrlGenerator(self.projectName, version);
        var requestFn = function(callback) {
            config.log('Request: post @ ' + urlGen.docCategoriesOrderUrl());
            request.post({
                url: urlGen.docCategoriesOrderUrl(),
                body: JSON.stringify(requestBodies[version]),
                jar: self.cookie,
                headers: {'Content-Type': 'application/json' }
            }, function(err, response) {
                if (err) {
                    callback(err, null);
                } else if (response.statusCode !== 200) {
                    callback(new Error('Category order could not be uploaded'), null);
                } else {
                    callback(null, true);
                }
            });
        };
        return requestFn;
    });

    async.parallelLimit(requestFns, 10, function(err) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null);
        }
    });
};

Requestor.prototype.uploadDocsOrder = function(resources, cb) {
    var self = this;
    var requestBodies = {};

    resources.forEach(function(doc) {
        requestBodies[doc.version] = requestBodies[doc.version] || [];
        requestBodies[doc.version].push({
            id: doc._id,
            parent: doc.categoryId,
            order: doc.order
        });
    });

    var requestFns = Object.keys(requestBodies).map(function(version) {
        var urlGen = new UrlGenerator(self.projectName, version);
        var requestFn = function(callback) {
            config.log('Request: post @ ' + urlGen.docsOrderUrl());
            request.post({
                url: urlGen.docsOrderUrl(),
                body: JSON.stringify(requestBodies[version]),
                jar: self.cookie,
                headers: {'Content-Type': 'application/json' }
            }, function(err, response) {
                if (err) {
                    callback(err, null);
                } else if (response.statusCode !== 200) {
                    callback(new Error('Doc order could not be uploaded'), null);
                } else {
                    callback(null, true);
                }
            });
        };
        return requestFn;
    });

    async.parallelLimit(requestFns, 10, function(err) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null);
        }
    });
};

module.exports = Requestor;
