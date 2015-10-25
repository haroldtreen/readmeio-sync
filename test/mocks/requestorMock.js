'use strict';

var path = require('path');
var js = require('jsonfile');

var MockHelpers = require('../helpers/mockHelpers');
var Requestor = require('../../lib/requestor');

var mockResponse = js.readFileSync(path.join(__dirname, '../fixtures/readmeContent.json'));

var overrides = {
    versions: function(cb) {
        cb(this.stubs.versions);
    },
    documentation: function(versions, cb) {
        cb(mockResponse);
    },
    customPages: function(versions, cb) {
        cb(mockResponse);
    },
    customContent: function(versions, cb) {
        cb(mockResponse);
    },
    uploadDocs: function(docs, cb) {
        cb([]);
    },
    uploadContent: function(customContent, cb) {
        cb([]);
    },
    uploadDocCategories: function(docCategories, cb) {
        cb([]);
    },
    uploadPages: function(customPages, cb) {
        cb([]);
    }
};

var RequestorMock = function(projectName, cookie) {
    this.projectName = projectName;
    this.cookie = cookie;

    this.stubs = {
        versions: [{ version: 'v1.0' }, { version: 'v2.0' }],
        documentation: [],
        customContent: [],
        customPages: []
    };

    return this;
};

RequestorMock.prototype = Object.create(Requestor.prototype);

RequestorMock.prototype = MockHelpers.override(RequestorMock.prototype, overrides);
RequestorMock = MockHelpers.spyOnPrototype(RequestorMock);

module.exports = RequestorMock;
