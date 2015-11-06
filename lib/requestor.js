'use strict';

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var utils = require('./utils');
var config = require('./config');
var RequestorFilters = require('./requestorFilters');
var UrlGenerator = require('./urlGenerator');

var MAX_PARALLEL_REQUESTS = 15;

var Requestor = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;
    this.cache = {};
};

/*
    HELPERS
    ******************
*/

var handleError = function(err, description) {
    throw new Error(description + err);
};

// Used to determine if the resource should remain in the array of failures
var filterAsyncResult = function(failedResource) {
    return !!failedResource;
};

Requestor.filterResource = function(resource, body) {
    var filter = RequestorFilters.forResource(resource);
    return filter(body);
};

Requestor.prototype.getReqBody = function(resource) {
    var urlGen = new UrlGenerator(this.projectName, resource.version);
    var urlFn = UrlGenerator.methodsForType(resource.resourceType).get;

    return { url: urlGen[urlFn](resource.slug), jar: this.cookie };
};


/*
    GET REQUEST FUNCTIONS
    **********************
*/

Requestor.prototype.resourceToGetRequestFn = function(resource) {
    var self = this;
    var requestFn = function(callback) {
        // config.log('Request: get @ ' + urlGen[urlFn]());
        request.get(self.getReqBody(resource), function(err, response, body) {
            if (err) {
                callback(err, null);
            }
            callback(null, Requestor.filterResource(resource, JSON.parse(body)));
        });
    };
    return requestFn;
};


// Fetches documentation data for each version of the project
Requestor.prototype.documentation = function(resources, cb) {
    var self = this;
    var requestFns = {};
    resources.forEach(function(resource) {
        resource.resourceType = 'documentation';
        requestFns[resource.version] = self.resourceToGetRequestFn(resource);
    });

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, 'Docs failed to download: ');
        } else {
            cb(results);
        }
    });
};


// Fetches the data for custom pages for each version
Requestor.prototype.customPages = function(resources, cb) {
    var self = this;
    var requestFns = {};
    resources.forEach(function(resource) {
        resource.resourceType = 'customPage';
        requestFns[resource.version] = self.resourceToGetRequestFn(resource);
    });

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, 'Custom pages failed to download: ');
        } else {
            cb(results);
        }
    });
};


// Fetches content like custom landing html and stylesheet data for each version
Requestor.prototype.customContent = function(resources, cb) {
    var self = this;
    var requestFns = {};
    resources.forEach(function(resource) {
        resource.resourceType = 'content';
        requestFns[resource.version] = self.resourceToGetRequestFn(resource);
    });

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, 'Custom content failed to download: ');
        } else {
            cb(results);
        }
    });
};

/*
    Downloads the version data for the project
*/
Requestor.prototype.versions = function(cb) {
    var urlGen = new UrlGenerator(this.projectName);

    request.get({ url: urlGen.versionsGetUrl(), jar: this.cookie }, function(err, response, body) {
        if (err) {
            handleError(err, 'Versions could not be downloaded:\n');
        } else {
            var versions = RequestorFilters.versions(JSON.parse(body));
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

        request(requestSettings, function(err, response, body) {
            var responseBody = JSON.parse(body);

            var slugSet = !!resource.slug;
            var isCustomSlug = slugSet && responseBody.slug !== resource.slug;
            var isDoc = !!resource.categorySlug;
            var wasPost = resource.method === 'post';

            // After creating a doc, we want to send an update request to set the slug before saving
            if (!err && isCustomSlug && isDoc && wasPost) {
                var defaultSlug = responseBody.slug;

                responseBody.slug = resource.slug;
                requestSettings.body = JSON.stringify(responseBody);

                requestSettings.method = 'put';
                requestSettings.url = requestSettings.url.replace(resource.categorySlug, defaultSlug);

                config.log('Request: ' + requestSettings.method + ' @ ' + requestSettings.url);
                request(requestSettings, requestCb);
            } else {
                // No custom slug - Carry on as normal
                requestCb(err, response, body);
            }
        });
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
                    if (respBody.excerpt) {
                        resource.excerpt = respBody.excerpt.replace('\n', ' ');
                    }
                    resource.title = respBody.title;
                    resource.slug = respBody.slug;
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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
        var body = utils.mdBody(fs.readFileSync(resource.body).toString());
        return JSON.stringify({
            title: resource.title,
            excerpt: resource.excerpt,
            body: utils.mdToReadme(body),
            type: resource.type
        });
    };
    var resourceToRequestConverter = this.buildResourceToUploadRequestFn(createBodyFn, urlFns);
    var requestFns = resources.map(resourceToRequestConverter);

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

        config.log('Request: delete @ ' + requestSettings.url);
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
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

Requestor.prototype.buildOrderingRequestsFns = function(requestBodies, urlFn) {
    var self = this;

    var requestFns = Object.keys(requestBodies).map(function(version) {
        var urlGen = new UrlGenerator(self.projectName, version);
        var requestFn = function(callback) {
            config.log('Request: post @ ' + urlGen[urlFn]());
            request.post({
                url: urlGen[urlFn](),
                body: JSON.stringify(requestBodies[version]),
                jar: self.cookie,
                headers: {'Content-Type': 'application/json' }
            }, function(err, response) {
                if (err) {
                    callback(err, null);
                } else if (response.statusCode !== 200) {
                    callback(new Error('Order could not be uploaded'), null);
                } else {
                    callback(null, true);
                }
            });
        };
        return requestFn;
    });

    return requestFns;
};

Requestor.prototype.uploadDocCategoriesOrder = function(resources, cb) {
    var requestBodies = {};

    resources.forEach(function(category) {
        requestBodies[category.version] = requestBodies[category.version] || {};
        requestBodies[category.version][category._id] = category.order;
    });

    var requestFns = this.buildOrderingRequestsFns(requestBodies, 'docCategoriesOrderUrl');

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null);
        }
    });
};

Requestor.prototype.uploadDocsOrder = function(resources, cb) {
    var requestBodies = {};

    resources.forEach(function(doc) {
        requestBodies[doc.version] = requestBodies[doc.version] || [];
        requestBodies[doc.version].push({
            id: doc._id,
            parent: doc.categoryId,
            order: doc.order
        });
    });

    var requestFns = this.buildOrderingRequestsFns(requestBodies, 'docsOrderUrl');

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null);
        }
    });
};

module.exports = Requestor;
