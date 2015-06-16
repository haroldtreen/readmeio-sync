'use strict';

var fs = require('fs');

var path = require('path');
var mkdirp = require('mkdirp');

var ContentExtractor = function(outputPath, registry) {
    this.outputPath = outputPath;
    this.registry = registry;
    this.projectName = Object.keys(registry)[0].toString();
    this.versions = Object.keys(registry[this.projectName]);
};

ContentExtractor.prototype.documentation = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var docs = self.registry[self.projectName][version].documentation;

        docs.forEach(function(category) {
            category.pages.forEach(function(page) {
                var docPath = self.docPath(version, category.title, page.title);

                ContentExtractor.saveFile(docPath, page.body);
                page.body = docPath;
            });
        });
    });

    cb(this.registry);
};

ContentExtractor.prototype.customPages = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var pages = self.registry[self.projectName][version].customPages;

        pages.forEach(function(page) {
            var pagePath = self.pagePath(version, page.title);

            ContentExtractor.saveFile(pagePath, page.body);
            page.body = pagePath;
        });
    });
    cb(this.registry);
};

ContentExtractor.prototype.customContent = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var content = self.registry[self.projectName][version].customContent.appearance;
        var contentPaths = self.contentPaths(version);

        ContentExtractor.saveFile(contentPaths.html_body, content.html_body);
        ContentExtractor.saveFile(contentPaths.stylesheet, content.stylesheet);

        content.html_body = contentPaths.html_body;
        content.stylesheet = contentPaths.stylesheet;
    });

    cb(this.registry);
};

ContentExtractor.prototype.all = function(cb) {
    var self = this;

    self.documentation(function() {
        self.customPages(function() {
            self.customContent(function() {
                cb(self.registry);
            });
        });
    });
};

ContentExtractor.prototype.docPath = function(version, categoryTitle, pageTitle) {
    return path.join(this.outputPath, this.projectName, version, 'documentation', categoryTitle, pageTitle + '.md');
};

ContentExtractor.prototype.pagePath = function(version, pageTitle) {
    return path.join(this.outputPath, this.projectName, version, 'customPages', pageTitle + '.md');
};

ContentExtractor.prototype.contentPaths = function(version) {
    return {
        html_body: path.join(this.outputPath, this.projectName, version, 'customContent', 'appearance', 'landing_page.html'),
        stylesheet: path.join(this.outputPath, this.projectName, version, 'customContent', 'appearance', 'styles.css')
    };
};

ContentExtractor.saveFile = function(filePath, content) {
    mkdirp.sync(path.dirname(filePath), {});
    fs.writeFileSync(filePath, content);
};

module.exports = ContentExtractor;
