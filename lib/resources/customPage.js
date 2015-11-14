'use strict';

var path = require('path');
var utils = require('../utils');

var Resource = require('./resource');

var CUSTOM_PAGE_PROPERTIES = ['title', 'html', 'slug', 'version'];

var CustomPage = function(properties) {
    Resource.call(this, properties, CUSTOM_PAGE_PROPERTIES);
    this._type = 'customPage';
};

CustomPage.filenameRegex = /(.+)\.html/;

CustomPage.fromFilepath = function(filepath) {
    var parsedPage = path.basename(filepath).match(this.filenameRegex);

    return new CustomPage({
        title: parsedPage[1],
        slug: utils.titleToSlug(parsedPage[1]),
        html: filepath
    });
};

CustomPage.filterValidFiles = function(filenames) {
    return filenames.filter(function(filename) {
        return filename.match(CustomPage.filenameRegex);
    });
};

CustomPage.prototype = Object.create(Resource.prototype);
CustomPage.prototype.constructor = CustomPage;

module.exports = CustomPage;
