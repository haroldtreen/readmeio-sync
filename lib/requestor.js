'use strict';

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var utils = require('./utils');
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
    'category': 'Documents failed to upload!',
    'doc': 'Document categories failed to upload!',
    'customPage': 'Custom Pages failed to upload!',
    'customContent': 'Custom content failed to upload!'
};

Requestor.deleteErrors = {
    'category': 'Documents failed to delete!',
    'doc': 'Document categories failed to delete!',
    'customPage': 'Custom Pages failed to delete!',
    'customContent': 'Custom content failed to delete!'
};

/*
    HELPERS
    ******************
*/

var handleError = function(err, description) {
    throw new Error(description + err);
};

Requestor.filterResource = function(resource, body) {
    var filter = RequestorFilters.forResource(resource);
    return filter(body);
};

Requestor.setResourceType = function(resources, type) {
    return resources.map(function(resource) {
        resource._type = type;
        resource.getType = function() {
            return this._type;
        };
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
    var urlFn = UrlGenerator.methodsForType(resource.getType()).get;

    return { url: urlGen[urlFn](resource.slug), jar: this.cookie };
};

// Accepts a resource and returns a request function for that resource
Requestor.prototype.resourceToGetRequestFn = function(resource) {
    var self = this;
    var requestFn = function(callback) {
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
            handleError(err, Requestor.downloadErrors[resources[0].getType()]);
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
    resources = Requestor.setResourceType(resources, 'customContent');
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
    doc: function(document) {
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
    customContent: function(content) {
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

Requestor.isCustomSlug = function(resource, responseBody) {
    var slugSet = !!resource.slug;
    var isCustomSlug = slugSet && responseBody.slug !== resource.slug;
    var isDoc = !!resource.categorySlug;
    var wasPost = resource.method === 'post';

    return isCustomSlug && isDoc && wasPost;
};

Requestor.prototype.uploadReqSettings = function(resource) {
    var reqSettings = {};
    var urlGen = new UrlGenerator(this.projectName, resource.version);
    var urlFn = UrlGenerator.methodsForType(resource.getType())[resource.method || 'put'];

    var putUrl = urlGen[urlFn](resource.slug);
    var postUrl = urlGen[urlFn](resource.categorySlug);

    reqSettings.method = resource.method || 'put';
    reqSettings.url = resource.method === 'put' ? putUrl : postUrl;
    reqSettings.jar = this.cookie;
    reqSettings.headers = {'Content-Type': 'application/json' };
    reqSettings.body = Requestor.uploadBodyFns[resource.getType()](resource);

    return reqSettings;
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

    request(requestSettings, cb);
};

Requestor.prototype.resourceToUploadRequestFn = function(resource) {
    var self = this;

    var requestFn = function(callback) {
        self.uploadResource(resource, function(err, response, body) {
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

Requestor.prototype.uploadResource = function(resource, requestCb) {
    var self = this;
    var requestSettings = self.uploadReqSettings(resource);

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

// Uploads an array of resources
Requestor.prototype.uploadResources = function(resources, cb) {
    var requestFns = resources.map(this.resourceToUploadRequestFn.bind(this));

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        var type = resources[0].getType();
        if (err) {
            handleError(err, Requestor.uploadErrors[type]);
        } else {
            cb(results);
        }
    });
};

// Uploads categories used to group pages of documentation.
['uploadDocCategories', 'uploadDocs', 'uploadPages', 'uploadContent'].forEach(function(method) {
    Requestor.prototype[method] = function(resources, cb) {
        this.uploadResources(resources, cb);
    };
});

/*
    DELETE REQUEST FUNCTIONS
    ***************************
*/
Requestor.prototype.resourceToDeleteRequestFn = function(resource) {
    var self = this;
    var requestFn = function(callback) {
        self.deleteResource(resource, function(err, response, body) {
            if (err) {
                console.log(err);
                resource.error = err;
                callback(null, resource);
            } else if (response.statusCode !== 200) {
                console.log('Bad Error Code: ' + response.statusCode);
                console.log('Body: ' + body);
                resource.error = response;
                callback(null, resource);
            } else {
                callback(null, resource);
            }
        });
    };
    return requestFn;
};

Requestor.prototype.deleteResource = function(resource, cb) {
    var requestSettings = {};
    var urlGen = new UrlGenerator(this.projectName, resource.version);
    var urlFn = UrlGenerator.methodsForType(resource.getType()).delete;

    requestSettings.method = 'DELETE';
    requestSettings.url = urlGen[urlFn](resource.slug);
    requestSettings.jar = this.cookie;

    request(requestSettings, cb);
};

Requestor.prototype.deleteResources = function(resources, cb) {
    var requestFns = resources.map(this.resourceToDeleteRequestFn.bind(this));

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, results) {
        if (err) {
            handleError(err, Requestor.deleteErrors[resources[0].getType()]);
        } else {
            cb(results);
        }
    });
};

// Uploads categories used to group pages of documentation.
['deleteDocs', 'deleteDocCategories', 'deletePages'].forEach(function(method) {
    Requestor.prototype[method] = function(resources, cb) {
        this.deleteResources(resources, cb);
    };
});

/*
    ORDER REQUEST FUNCTIONS
    ***************************
*/

Requestor.uploadOrderRequestBodyFns = {
    'category': function(categories) {
        var requestBodies = {};

        categories.forEach(function(category) {
            requestBodies[category.version] = requestBodies[category.version] || {};
            requestBodies[category.version][category._id] = category.order;
        });
        return requestBodies;
    },
    'doc': function(docs) {
        var requestBodies = {};

        docs.forEach(function(doc) {
            requestBodies[doc.version] = requestBodies[doc.version] || [];
            requestBodies[doc.version].push({
                id: doc._id,
                category: doc.categoryId,
                parentPage: null,
                order: doc.order
            });
        });
        return requestBodies;
    }
};

Requestor.prototype.buildOrderingRequestsFns = function(requestBodies, urlFn) {
    var self = this;
    var requestFns = {};
    Object.keys(requestBodies).forEach(function(version) {
        var urlGen = new UrlGenerator(self.projectName, version);

        var requestFn = function(callback) {
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
        requestFns[version] = requestFn;
    });

    return requestFns;
};

Requestor.prototype.uploadOrder = function(resources, cb) {
    var type = resources[0].getType();

    var requestBodies = Requestor.uploadOrderRequestBodyFns[type](resources);
    var urlFn = UrlGenerator.methodsForType(type).order;

    var requestFns = this.buildOrderingRequestsFns(requestBodies, urlFn);

    async.parallelLimit(requestFns, MAX_PARALLEL_REQUESTS, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(result);
        }
    });
};

['uploadDocsOrder', 'uploadDocCategoriesOrder'].forEach(function(method) {
    Requestor.prototype[method] = function(resources, cb) {
        this.uploadOrder(resources, cb);
    };
});

module.exports = Requestor;
