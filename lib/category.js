'use strict';

var CATEGORY_PROPERTIES = ['title', 'slug', 'excerpt', 'body', 'order', 'pages'];

var Category = function(properties) {
    var self = this;
    Object.keys(properties).forEach(function(key) {
        if (CATEGORY_PROPERTIES.indexOf(key) > -1) {
            self[key] = properties[key];
        }
    });
};

Category.filenameRegex = /(\d+).(.+)/;

module.exports = Category;
