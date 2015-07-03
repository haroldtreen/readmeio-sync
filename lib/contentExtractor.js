'use strict';

var fs = require('fs');

var path = require('path');
var mkdirp = require('mkdirp');

/*  Content Extractor:
**  When content is downloaded from Readme.io, everything is in one json object.
**  This class extracts the body content out of that object and puts it into files.
*/
var ContentExtractor = function(outputPath, registry) {
    this.outputPath = outputPath;
    this.registry = registry;
    this.versions = registry.versions;
};

ContentExtractor.prototype.documentation = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var docs = self.registry.docs(version);

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
        var pages = self.registry.pages(version);

        pages.forEach(function(page) {
            var pagePath = self.pagePath(version, page.title);

            ContentExtractor.saveFile(pagePath, page.html);
            page.html = pagePath;
        });
    });
    cb(this.registry);
};

ContentExtractor.prototype.customContent = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var content = self.registry.content(version).appearance;
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
    return path.join(this.outputPath, this.registry.projectName, version, 'documentation', categoryTitle, pageTitle + '.md');
};

ContentExtractor.prototype.pagePath = function(version, pageTitle) {
    return path.join(this.outputPath, this.registry.projectName, version, 'customPages', pageTitle + '.html');
};

ContentExtractor.prototype.contentPaths = function(version) {
    return {
        html_body: path.join(this.outputPath, this.registry.projectName, version, 'customContent', 'appearance', 'landing_page.html'),
        stylesheet: path.join(this.outputPath, this.registry.projectName, version, 'customContent', 'appearance', 'styles.css')
    };
};

ContentExtractor.saveFile = function(filePath, content) {
    mkdirp.sync(path.dirname(filePath), {});
    fs.writeFileSync(filePath, content, 'utf8');
};

module.exports = ContentExtractor;
