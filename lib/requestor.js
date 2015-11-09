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
    DICTIONARIES
    *************
 */

Requestor.downloadErrors = {
    'documentation': 'Documentation failed to download!',
    'customPage': 'Custom Pages failed to download!',
    'content': 'Custom content failed to download!'
};

Requestor.uploadErrors = {
    'docCategory': 'Documents failed to upload!',
    'document': 'Document categories failed to upload!',
    'customPage': 'Custom Pages failed to upload!',
    'content': 'Custom content failed to upload!'
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

Requestor.setResourceType = function(resources, type) {
    return resources.map(function(resource) {
        resource.resourceType = type;
        return resource;
    });
};

/*
    GET REQUEST FUNCTIONS
    **********************
*/

// Return the GET request body for a given resource
Requestor.prototype.getReqBody = function(resource) {
    var urlGen = new UrlGenerator(this.projectName, resource.version);
    var urlFn = UrlGenerator.methodsForType(resource.resourceType).get;

    return { url: urlGen[urlFn](resource.slug), jar: this.cookie };
};

// Accepts a resource and returns a request function for that resource
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

// Take an array of resources and downloads them
Requestor.prototype.downloadResources = function(resources, cb) {
    var self = this;
    var requestFns = {};

    resources.forEach(function(resource) {
        requestFns[resource.version] = self.resourceToGetRequestFn(resource);
    });

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, Requestor.downloadErrors[resources[0].resourceType]);
        } else {
            cb(results);
        }
    });
};

// Fetches documentation data for each version of the project
Requestor.prototype.documentation = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'documentation');
    this.downloadResources(resources, cb);
};


// Fetches the data for custom pages for each version
Requestor.prototype.customPages = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'customPage');
    this.downloadResources(resources, cb);
};


// Fetches content like custom landing html and stylesheet data for each version
Requestor.prototype.customContent = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'content');
    this.downloadResources(resources, cb);
};

/*
    GET VERSIONS FUNCTION
    *********************
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

// Functions for generating a request body for a resource
Requestor.uploadBodyFns = {
    category: function(category) {
        return JSON.stringify({ title: category.title });
    },
    document: function(document) {
        var body = utils.mdBody(fs.readFileSync(document.body).toString());
        return JSON.stringify({
            title: document.title,
            excerpt: document.excerpt,
            body: utils.mdToReadme(body),
            type: document.type
        });
    },
    customPage: function(customPage) {
        var html = fs.readFileSync(customPage.html).toString();
        if (customPage.selector) {
            var $ = cheerio.load(html);
            html = $(customPage.selector).html();
        }

        return JSON.stringify({
            fullscreen: true,
            htmlmode: true,
            title: customPage.title,
            html: html,
            body: 'body'
        });
    },
    content: function(content) {
        var html = fs.readFileSync(content.appearance.html_body).toString();
        if (content.selector) {
            var $ = cheerio.load(html);
            html = $(content.selector).html();
        }

        return JSON.stringify({
            appearance: {
                html_body: html,
                stylesheet: fs.readFileSync(content.appearance.stylesheet).toString()
            }
        });
    }
};

Requestor.prototype.uploadReqSettings = function(resource) {
    var reqSettings = {};
    var urlGen = new UrlGenerator(this.projectName, resource.version);
    var urlFn = UrlGenerator.methodsForType(resource.resourceType)[resource.method || 'put'];

    var putUrl = urlGen[urlFn](resource.slug);
    var postUrl = urlGen[urlFn](resource.categorySlug);

    reqSettings.method = resource.method || 'put';
    reqSettings.url = resource.method === 'put' ? putUrl : postUrl;
    reqSettings.jar = this.cookie;
    reqSettings.headers = {'Content-Type': 'application/json' };
    reqSettings.body = Requestor.uploadBodyFns[resource.resourceType](resource);

    return reqSettings;
};

Requestor.isCustomSlug = function(resource, responseBody) {
    var slugSet = !!resource.slug;
    var isCustomSlug = slugSet && responseBody.slug !== resource.slug;
    var isDoc = !!resource.categorySlug;
    var wasPost = resource.method === 'post';

    return isCustomSlug && isDoc && wasPost;
};

Requestor.prototype.setCustomSlug = function(resource, responseBody, cb) {
    var requestSettings = this.uploadReqSettings(resource);
    var defaultSlug = responseBody.slug;

    // Send back a similiar request with the custom slug set.
    responseBody.slug = resource.slug;
    requestSettings.body = JSON.stringify(responseBody);

    requestSettings.method = 'put';
    // Request needs to be made against the default slug
    requestSettings.url = requestSettings.url.replace(resource.categorySlug, defaultSlug);

    // config.log('Request: ' + requestSettings.method + ' @ ' + requestSettings.url);
    request(requestSettings, cb);
};

Requestor.prototype.resourceToUploadRequestFn = function(resource) {
    var self = this;

    var uploadResource = function(requestCb) {
        var requestSettings = self.uploadReqSettings(resource);

        // config.log('Request: ' + requestSettings.method + ' @ ' + requestSettings.url);
        request(requestSettings, function(err, response, body) {
            var responseBody = JSON.parse(body);

            // After creating a doc, we want to send an update request to set the slug before saving
            if (!err && Requestor.isCustomSlug(resource, responseBody)) {
                self.setCustomSlug(resource, responseBody, requestCb);
            } else {
                // No custom slug - Carry on as normal
                requestCb(err, response, body);
            }
        });
    };

    var requestFn = function(callback) {
        uploadResource(function(err, response, body) {
            if (err) {
                console.log(err);
                resource.error = err;
            } else if (response.statusCode !== 200) {
                console.log('Bad Error Code: ', response.statusCode);
                console.log('Body: ', body);
                resource.error = response;
            } else {
                var respBody = JSON.parse(body);
                resource.excerpt = resource.excerpt && respBody.excerpt.replace('\n', ' ');
                resource.title = respBody.title;
                resource.slug = respBody.slug;
                resource._id = respBody._id;
            }
            callback(null, resource);
        });
    };
    return requestFn;
};

// Uploads an array of resources
Requestor.prototype.uploadResources = function(resources, cb) {
    var self = this;
    var requestFns = resources.map(function(resource) {
        return self.resourceToUploadRequestFn(resource);
    });

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, Requestor.uploadErrors[resources[0].resourceType]);
        } else {
            cb(results);
        }
    });
};

// Uploads categories used to group pages of documentation.
Requestor.prototype.uploadDocCategories = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'category');
    this.uploadResources(resources, cb);
};

Requestor.prototype.uploadDocs = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'document');
    this.uploadResources(resources, cb);
};

Requestor.prototype.uploadPages = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'customPage');
    this.uploadResources(resources, cb);
};

Requestor.prototype.uploadContent = function(resources, cb) {
    resources = Requestor.setResourceType(resources, 'content');
    this.uploadResources(resources, cb);
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
