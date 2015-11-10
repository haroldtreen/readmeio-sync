'use strict';

var utils = require('../utils');
var path = require('path');

var CATEGORY_PROPERTIES = ['title', 'slug', 'excerpt', 'body', 'order', 'pages'];

var Category = function(properties) {
    var self = this;
    this._type = 'category';
    Object.keys(properties).forEach(function(key) {
        if (CATEGORY_PROPERTIES.indexOf(key) > -1) {
            self[key] = properties[key];
        }
    });
};

Category.filenameRegex = /(\d+).(.+)/;

Category.fromFilepath = function(filepath) {
    filepath = path.basename(filepath);
    var parsedCategory = filepath.match(Category.filenameRegex);

    return new Category({
        order: parseInt(parsedCategory[1]),
        title: parsedCategory[2],
        slug: utils.titleToSlug(parsedCategory[2])
    });
};

Category.prototype.getType = function() {
    return this._type;
};

module.exports = Category;
