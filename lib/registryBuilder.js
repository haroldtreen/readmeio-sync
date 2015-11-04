'use strict';

var fs = require('fs');
var path = require('path');

var Registry = require('./registry');

var Document = require('./document');
var Category = require('./category');
var CustomPage = require('./customPage');

var RegistryBuilder = {};

/*
 *  BUILDING DOCUMENTATION
 */

RegistryBuilder.docsSection = function(docsPath) {
    var categoryPaths = fs.readdirSync(docsPath).filter(function(categoryDir) {
        return categoryDir.match(Category.filenameRegex);
    }).map(function(categoryDir) {
        return path.join(docsPath, categoryDir);
    });

    return RegistryBuilder.parseCategories(categoryPaths);
};

RegistryBuilder.parseCategories = function(categoryPaths) {
    var categories = categoryPaths.map(function(categoryPath) {
        var category = Category.fromFilepath(categoryPath);
        category.pages = RegistryBuilder.parsePages(categoryPath);

        return category;
    }).sort(function(category1, category2) {
        return (category1.order - category2.order);
    });

    return categories;
};

RegistryBuilder.parsePages = function(categoryPath) {
    return Document.filterValidFiles(fs.readdirSync(categoryPath)
    ).map(function(page) {
        return Document.fromFilepath(path.join(categoryPath, page));
    }).sort(function(page1, page2) {
        return (page1.order - page2.order);
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
