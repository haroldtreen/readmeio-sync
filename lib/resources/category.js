'use strict';

var utils = require('../utils');
var path = require('path');

var Document = require('./document');
var Resource = require('./resource');

var CATEGORY_PROPERTIES = ['title', 'slug', 'order', 'pages', 'version'];

var Category = function(properties) {
    Resource.call(this, properties, CATEGORY_PROPERTIES);
    this._type = 'category';
    if (this.pages) {
        this.pages = this.pages.map(function(doc) {
            return new Document(doc);
        });
    }
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

Category.prototype = Object.create(Resource.prototype);
Category.prototype.constructor = Category;

module.exports = Category;
