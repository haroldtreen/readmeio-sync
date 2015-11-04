'use strict';

var fs = require('fs');
var path = require('path');

var Registry = require('./registry');
var utils = require('./utils');

var Document = require('./document');
var Category = require('./category');
var CustomPage = require('./customPage');

var RegistryBuilder = {};

RegistryBuilder.regex = {
    pageDescriptor: Document.filenameRegex,
    categoryDescriptor: Category.filenameRegex
};

/*
 *  BUILDING DOCUMENTATION
 */

RegistryBuilder.docsSection = function(docsPath) {
    var categoryPaths = fs.readdirSync(docsPath).filter(function(categoryDir) {
        return categoryDir.match(RegistryBuilder.regex.categoryDescriptor);
    }).map(function(categoryDir) {
        return path.join(docsPath, categoryDir);
    });

    return RegistryBuilder.parseCategories(categoryPaths);
};

RegistryBuilder.parseCategories = function(categoryPaths) {
    var categories = categoryPaths.map(function(categoryPath) {
        var pages = fs.readdirSync(categoryPath).filter(function(page) {
            return page.match(RegistryBuilder.regex.pageDescriptor);
        }).map(function(page) {
            return path.join(categoryPath, page);
        });

        var category = RegistryBuilder.parseCategory(path.basename(categoryPath));
        category.pages = pages.map(function(pagePath) {
            return Document.fromFilepath(pagePath);
        });

        category.pages.sort(function(page1, page2) { return (page1.order - page2.order); });

        return category;
    });

    categories.sort(function(category1, category2) {
        return (category1.order - category2.order);
    });

    return categories;
};

RegistryBuilder.parseCategory = function(categoryDescriptor) {
    var parsedCategory = categoryDescriptor.match(this.regex.categoryDescriptor);

    return new Category({
        order: parseInt(parsedCategory[1]),
        title: parsedCategory[2],
        slug: utils.titleToSlug(parsedCategory[2])
    });
};

/*
 *  BUILDING CUSTOM PAGES
 */

RegistryBuilder.customPagesSection = function(customPagesPath) {
    var pagePaths = fs.readdirSync(customPagesPath).map(function(pageFile) {
        return path.join(customPagesPath, pageFile);
    });
    return RegistryBuilder.parseCustomPages(pagePaths);
};

RegistryBuilder.parseCustomPages = function(customPagesPaths) {
    customPagesPaths = CustomPage.filterValidFiles(customPagesPaths);
    var customPages = customPagesPaths.map(function(pagePath) {
        return CustomPage.fromFilepath(pagePath);
    });

    return customPages;
};

/*
 *  BUILD CUSTOM CONTENT
 */

RegistryBuilder.customContentSection = function(customContents) {
    return customContents;
};

/*
 *  BUILD REGISTRY
 */

RegistryBuilder.build = function(buildSettings) {
    var registryData = buildSettings;
    var projectName = Object.keys(buildSettings)[0];
    var versions = Object.keys(registryData[projectName]);

    versions.forEach(function(version) {
        var versionData = registryData[projectName][version];

        var docsPath = versionData.documentation;
        versionData.documentation = RegistryBuilder.docsSection(docsPath);

        var customPagesPath = versionData.customPages;
        versionData.customPages = RegistryBuilder.customPagesSection(customPagesPath);

        var customContent = versionData.customContent;
        versionData.customContent = RegistryBuilder.customContentSection(customContent);
    });

    return new Registry(registryData);
};

module.exports = RegistryBuilder;
