'use strict';

var path = require('path');
var utils = require('../utils');

var CUSTOM_PAGE_PROPERTIES = ['title', 'html', 'slug'];

var CustomPage = function(properties) {
    var self = this;
    this.resourceType = 'customPage';
    Object.keys(properties).forEach(function(key) {
        if (CustomPage.validProperty(key) > -1) {
            self[key] = properties[key];
        }
    });
};

CustomPage.filenameRegex = /(.+)\.html/;

CustomPage.validProperty = function(property) {
    return CUSTOM_PAGE_PROPERTIES.indexOf(property) > -1;
};

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

module.exports = CustomPage;
