'use strict';

var path = require('path');
var utils = require('./utils');

var CUSTOM_PAGE_PROPERTIES = ['title', 'html', 'slug'];

var CustomPage = function(properties) {
    var self = this;
    Object.keys(properties).forEach(function(key) {
        if (CUSTOM_PAGE_PROPERTIES.indexOf(key) > -1) {
            self[key] = properties[key];
        }
    });
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
    var self = this;
    return filenames.filter(function(filename) {
        return filename.match(self.filenameRegex);
    });
};


module.exports = CustomPage;
