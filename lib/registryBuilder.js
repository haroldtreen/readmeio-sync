'use strict';

var fs = require('fs');
var path = require('path');

var utils = require('./utils');

var RegistryBuilder = {};

RegistryBuilder.docsSection = function(docsPath) {
    var categories = fs.readdirSync(docsPath).map(function(category) {
        return path.join(docsPath, category);
    });

    return RegistryBuilder.parseCategories(categories);
};

RegistryBuilder.parseCategories = function(categoryPaths) {
    var docs = categoryPaths.map(function(categoryPath) {
        var pages = fs.readdirSync(categoryPath).map(function(page) {
            return path.join(categoryPath, page);
        });

        var category = RegistryBuilder.parseCategory(path.basename(categoryPath));
        category.pages = pages.map(function(pagePath) {
            return RegistryBuilder.parseMdFile(pagePath);
        });

        category.pages.sort(function(page1, page2) { return page1.order > page2.order; });

        return category;
    });

    docs.sort(function(category1, category2) {
        return category1.order > category2.order;
    });

    return docs;
};

RegistryBuilder.parseCategory = function(categoryDescriptor) {
    var category = {};

    var parsedCategory = categoryDescriptor.match(/(\d+).(.+)/);

    category.order = parseInt(parsedCategory[1]);
    category.title = parsedCategory[2];
    category.slug = utils.titleToSlug(category.title);

    return category;
};

RegistryBuilder.parseMdFile = function(pagePath) {
    var page = {};

    var pageDescriptor = path.basename(pagePath);
    var parsedPage = pageDescriptor.match(/(\d+).(.+)\.md/);

    page.order = parseInt(parsedPage[1]);
    page.slug = parsedPage[2];
    page.body = pagePath;

    var metadata = utils.mdMetadata(fs.readFileSync(pagePath).toString());

    for (var attr in metadata) {
        if (metadata.hasOwnProperty(attr)) {
            page[attr] = metadata[attr];
        }
    }

    return page;
};

module.exports = RegistryBuilder;
