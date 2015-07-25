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

ContentExtractor.extractableMetadata = ['excerpt', 'slug'];

ContentExtractor.prototype.documentation = function(cb) {
    var self = this;

    self.versions.forEach(function(version) {
        var docs = self.registry.docs(version);

        docs.forEach(function(category, categoryIndex) {
            category.pages.forEach(function(page, pageIndex) {
                var docPath = self.docPath(version, categoryIndex + '-' + category.title, pageIndex + '-' + page.title);
                var docBody = ContentExtractor.prependMetadata(page, page.body);

                ContentExtractor.saveFile(docPath, docBody);
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
                self.saveSettings(function() {
                    cb(self.registry);
                });
            });
        });
    });
};

ContentExtractor.prototype.versionPath = function(version) {
    return path.join(this.outputPath, this.registry.projectName, version);
};

ContentExtractor.prototype.docPath = function(version, categoryTitle, pageTitle) {
    return path.join(this.versionPath(version), 'documentation', categoryTitle, pageTitle + '.md');
};

ContentExtractor.prototype.pagePath = function(version, pageTitle) {
    return path.join(this.versionPath(version), 'customPages', pageTitle + '.html');
};

ContentExtractor.prototype.contentPaths = function(version) {
    return {
        html_body: path.join(this.versionPath(version), 'customContent', 'appearance', 'landing_page.html'),
        stylesheet: path.join(this.versionPath(version), 'customContent', 'appearance', 'styles.css')
    };
};

ContentExtractor.prototype.saveSettings = function(cb) {
    var self = this;
    var settings = {};
    var projectSettings = settings[self.registry.projectName] = {};

    self.versions.forEach(function(version) {
        projectSettings[version] = {};
        projectSettings[version].documentation = path.join(self.versionPath(version), 'documentation');
        projectSettings[version].customPages = path.join(self.versionPath(version), 'customPages');
        projectSettings[version].customContent = {
            appearance: self.contentPaths(version)
        };
    });

    fs.writeFile(path.join(self.outputPath, 'syncPaths.json'), JSON.stringify(settings, null, 4), 'utf8', cb);

};

ContentExtractor.prependMetadata = function(metadata, body) {
    var metadataLines = [];
    ContentExtractor.extractableMetadata.forEach(function(key) {
        if (metadata[key]) {
            var metadataLine = key + ': ' + metadata[key].replace('\n', ' ');
            metadataLines.push(metadataLine);
        }
    });

    return metadataLines.join('\n') + '\n\n' + body;
};

ContentExtractor.saveFile = function(filePath, content) {
    mkdirp.sync(path.dirname(filePath), {});
    fs.writeFileSync(filePath, content, 'utf8');
};

module.exports = ContentExtractor;
