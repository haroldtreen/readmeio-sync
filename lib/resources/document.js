'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('../utils');

var Resource = require('./resource');

var DOC_PROPERTIES = ['title', 'slug', 'excerpt', 'body', 'order'];

var Document = function(properties) {
    Resource.call(this, properties, DOC_PROPERTIES);
    this._type = 'doc';
};

Document.filenameRegex = /(\d+).(.+)\.md/;

Document.validProperty = function(property) {
    return DOC_PROPERTIES.indexOf(property) > -1;
};

Document.fromFilepath = function(filepath) {
    var pageDescriptor = path.basename(filepath);
    var parsedPage = pageDescriptor.match(this.filenameRegex);

    var doc = {
        order: parseInt(parsedPage[1]),
        title: parsedPage[2],
        body: filepath
    };

    var metadata = utils.mdMetadata(fs.readFileSync(filepath).toString());

    for (var attr in metadata) {
        if (Document.validProperty(attr)) {
            doc[attr] = metadata[attr];
        }
    }

    return new Document(doc);
};

Document.filterValidFiles = function(filenames) {
    return filenames.filter(function(filename) {
        return filename.match(Document.filenameRegex);
    });
};

Document.prototype = Object.create(Resource.prototype);
Document.prototype.constructor = Document;

module.exports = Document;
