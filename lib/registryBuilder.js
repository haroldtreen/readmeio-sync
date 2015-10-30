'use strict';

var fs = require('fs');
var path = require('path');

var Registry = require('./registry');
var utils = require('./utils');

var RegistryBuilder = {};

RegistryBuilder.regex = {
    pageDescriptor: /(\d+).(.+)\.md/,
    categoryDescriptor: /(\d+).(.+)/
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
    var docs = categoryPaths.map(function(categoryPath) {
        var pages = fs.readdirSync(categoryPath).filter(function(page) {
            return page.match(RegistryBuilder.regex.pageDescriptor);
        }).map(function(page) {
            return path.join(categoryPath, page);
        });

        var category = RegistryBuilder.parseCategory(path.basename(categoryPath));
        category.pages = pages.map(function(pagePath) {
            return RegistryBuilder.parseMdFile(pagePath);
        });

        category.pages.sort(function(page1, page2) { return (page1.order - page2.order); });

        return category;
    });

    docs.sort(function(category1, category2) {
        return (category1.order - category2.order);
    });

    return docs;
};

RegistryBuilder.parseCategory = function(categoryDescriptor) {
    var category = {};

    var parsedCategory = categoryDescriptor.match(this.regex.categoryDescriptor);

    category.order = parseInt(parsedCategory[1]);
    category.title = parsedCategory[2];
    category.slug = utils.titleToSlug(category.title);

    return category;
};

RegistryBuilder.parseMdFile = function(pagePath) {
    var page = {};

    var pageDescriptor = path.basename(pagePath);
    var parsedPage = pageDescriptor.match(this.regex.pageDescriptor);

    page.order = parseInt(parsedPage[1]);
    page.title = parsedPage[2];
    page.body = pagePath;

    var metadata = utils.mdMetadata(fs.readFileSync(pagePath).toString());

    for (var attr in metadata) {
        if (metadata.hasOwnProperty(attr)) {
            page[attr] = metadata[attr];
        }
    }

    return page;
};


/*
 *  BUILDING CUSTOM PAGES
 */

RegistryBuilder.customPagesSection = function(customPagesPath) {
    var pagePaths = fs.readdirSync(customPagesPath).map(function(pageFile) {
        return path.join(customPagesPath, pageFile);
    });
    return RegistryBuilder.parseHtmlFiles(pagePaths);
};

RegistryBuilder.parseHtmlFiles = function(customPagesPaths) {
    customPagesPaths = customPagesPaths.filter(function(path) { return path.match(/\.html/); });
    var customPages = customPagesPaths.map(function(pagePath) {
        return RegistryBuilder.parseCustomPage(pagePath);
    });

    return customPages;
};

RegistryBuilder.parseCustomPage = function(customPagePath) {
    var page = {};

    var parsedPage = path.basename(customPagePath).match(/(.+)\.html/);
    page.title = parsedPage[1];
    page.slug = utils.titleToSlug(page.title);
    page.html = customPagePath;

    return page;
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
