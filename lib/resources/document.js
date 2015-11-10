'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('../utils');

var DOC_PROPERTIES = ['title', 'slug', 'excerpt', 'body', 'order'];

var Document = function(properties) {
    var self = this;
    this._type = 'doc';
    Object.keys(properties).forEach(function(key) {
        if (Document.validProperty(key) > -1) {
            self[key] = properties[key];
        }
    });
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

Document.prototype.getType = function() {
    return this._type;
};

module.exports = Document;
