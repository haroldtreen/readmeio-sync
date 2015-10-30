'use strict';

var fs = require('fs');

var Registry = function(registryData) {
    this.registryData = registryData;
    this.projectName = Object.keys(registryData)[0];
    this.versions = Object.keys(registryData[this.projectName]);
};

Registry.prototype.project = function() {
    return this.registryData[Object.keys(this.registryData)[0]];
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
        self.docs(version).forEach(function(category, index) {
            category.version = version;
            category.order = index;
            categories.push(category);
        });
    });
    return categories;
};

Registry.prototype.allDocs = function() {
    var allDocs = [];
    this.allDocCategories().forEach(function(category) {
        category.pages.forEach(function(page, index) {
            page.order = index;
            page.version = category.version;
            page.categorySlug = category.slug;
            page.categoryTitle = category.title;
            page.categoryId = category._id;
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

Registry.prototype.allCustomContent = function() {
    var self = this;
    var content;
    return self.versions.map(function(version) {
        content = self.content(version);
        content.version = version;

        return content;
    });
};

Registry.prototype.content = function(version) {
    return this.version(version).customContent;
};

Registry.prototype.export = function() {
    return this.registryData;
};

Registry.prototype.save = function() {
    var allDocs = this.allDocs();

    allDocs.forEach(function(doc) {
        var docLines = fs.readFileSync(doc.body).toString().split('\n');
        for (var i = 0; i < docLines.length; i++) {
            if (docLines[i].match(/^[S|s]lug:\s+/m)) {
                docLines[i] = 'slug: ' + doc.slug;
                break;
            } else if (docLines[i] === '') {
                docLines.splice(i, 0, 'slug: ' + doc.slug);
                break;
            }
        }

        var newContent = docLines.join('\n');

        fs.writeFileSync(doc.body, newContent, 'utf8');
    });
};

Registry.prototype.diff = function(prevRegistry) {
    var self = this;
    var contentIndex = {};
    var contentDiff = { deleted: {}, added: {} };

    this.versions.forEach(function(version) {
        contentIndex[version] = {};
        contentIndex[version].allDocCategories = {};
        contentIndex[version].allDocs = {};
        contentIndex[version].allCustomPages = {};
    });

    var buildIndexer = function(source, section) {
        var indexer = function(resource) {
            if (resource.slug) {
                var sectionIdx = contentIndex[resource.version][section];
                var slugIdx = sectionIdx[resource.slug] = sectionIdx[resource.slug] || {};
                slugIdx[source] = true;
            }
        };
        return indexer;
    };

    var diffSection = function(section) {
        contentDiff.deleted[section] = [];
        contentDiff.added[section] = [];

        var versions = Object.keys(contentIndex);

        versions.forEach(function(version) {
            var slugs = Object.keys(contentIndex[version][section]);

            slugs.forEach(function(slug) {
                var states = contentIndex[version][section][slug];

                if (!states.current && states.previous) {
                    contentDiff.deleted[section].push({ slug: slug, version: version });
                } else if (states.current && !states.previous) {
                    contentDiff.added[section].push({ slug: slug, version: version });
                }
            });
        });
    };

    var addSearchHelpers = function(diffObject) {
        var findMatch = function(section, search) { return contentIndex[search.version][section][search.slug]; };

        diffObject.isAdded = function(section, search) {
            var match = findMatch(section, search);
            return !search.slug || match.current && !match.previous ? true : false;
        };
        diffObject.isDeleted = function(section, search) {
            var match = findMatch(section, search);
            return !search.slug || !match.current && match.previous ? true : false;
        };

        return diffObject;
    };

    ['allDocCategories', 'allDocs', 'allCustomPages'].forEach(function(section) {
        self[section]().forEach(buildIndexer('current', section));
        prevRegistry[section]().forEach(buildIndexer('previous', section));
        diffSection(section);
    });

    contentDiff = addSearchHelpers(contentDiff);

    return contentDiff;
};

module.exports = Registry;
