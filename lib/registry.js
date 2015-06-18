'use strict';

var fs = require('fs');

var Registry = function(projectName, versions) {
    this.registryData = {};
    this.versions = versions;
    this.projectName = projectName;

    this.registryData[projectName] = {};

    this.addVersions(versions);
};

Registry.prototype.project = function() {
    return this.registryData[this.projectName];
};

Registry.prototype.addVersions = function(versions) {
    var self = this;
    if (versions) {
        versions.forEach(function(version) {
            self.addVersion(version);
        });
    }
};

Registry.prototype.addVersion = function(version) {
    this.project()[version] = {};
};

Registry.prototype.version = function(version) {
    return this.project()[version];
};

Registry.prototype.docs = function(version) {
    return this.version(version).documentation;
};

Registry.prototype.allDocCategories = function() {
    var self = this;
    var categories = [];
    self.versions.forEach(function(version) {
        self.docs(version).forEach(function(category) {
            category.version = version;
            categories.push(category);
        });
    });
    return categories;
};

Registry.prototype.allDocs = function() {
    var allDocs = [];
    this.allDocCategories().forEach(function(category) {
        category.pages.forEach(function(page) {
            page.version = category.version;
            page.categorySlug = category.slug;
            page.categoryTitle = category.title;
            allDocs.push(page);
        });
    });

    return allDocs;
};

Registry.prototype.pages = function(version) {
    return this.version(version).customPages;
};

Registry.prototype.allCustomPages = function() {
    var self = this;
    var allCustomPages = [];

    self.versions.forEach(function(version) {
        self.pages(version).forEach(function(page) {
            page.version = version;
            allCustomPages.push(page);
        });
    });
    return allCustomPages;
};

Registry.prototype.content = function(version) {
    return this.version(version).customContent;
};

Registry.prototype.import = function(registryData) {
    this.registryData = registryData;
    this.projectName = Object.keys(registryData)[0];
    this.versions = Object.keys(registryData[this.projectName]);
};

Registry.prototype.export = function() {
    return this.registryData;
};

Registry.prototype.save = function(path) {
    fs.writeFileSync(path + '/syncRegistry.json', JSON.stringify(this.export(), null, 4));
};

module.exports = Registry;
