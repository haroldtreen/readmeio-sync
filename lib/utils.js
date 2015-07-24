'use strict';

var Utils = {};

Utils.markdownCodeRegex = /```([a-z]+)\n((?:[^`]|(?:\\`))+)```/g;
Utils.readmeCodeRegex = /\[block:code\]\s*{\s*"codes":\s*\[\s*{\s*"code":\s*"(.*)",\s*"language":\s*"(.*)"\s*}\s*\]\s*\}\s*\[\/block\]/g;
Utils.metadataRegex = /([a-zA-Z]+):\s?(.*)$/;

Utils.mdToReadme = function(markdown) {
    return Utils.replaceCodeBlocks(markdown);
};

Utils.replaceCodeBlocks = function(markdown) {
    var code, language;
    var match = Utils.markdownCodeRegex.exec(markdown);

    while (match) {
        code = match[2];
        language = match[1];

        markdown = markdown.replace(match[0], Utils.buildCodeBlock(code, language));
        match = Utils.markdownCodeRegex.exec(markdown);
    }

    return markdown;
};

Utils.buildCodeBlock = function(code, language) {
    var codeTemplate = { codes: [{ code: '<code-string>', language: language }]};
    var codeBlock = ['[block:code]', JSON.stringify(codeTemplate, null, 4), '[/block]'].join('\n').replace('"<code-string>"', JSON.stringify(code));

    return codeBlock;
};

Utils.titleToSlug = function(title) {
    var slug = title.replace(/[a-zA-Z]/g, function(text) { return text.toLowerCase(); });
    slug = slug.replace(/[^a-zA-Z0-9]+/g, '-');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/-$/, '');

    return slug;
};

Utils.mdMetadata = function(markdown) {
    var metadata = {};

    var lines = markdown.split('\n');
    var index = 0;
    var match = lines[index].match(Utils.metadataRegex);

    while (match) {
        metadata[match[1].toLowerCase()] = match[2];
        match = lines[index++].match(Utils.metadataRegex);
    }

    return metadata;
};

Utils.mdBody = function(markdown) {
    markdown = markdown.replace(/(slug|title|excerpt):\s.*/g, '');
    return markdown.trim();
};

module.exports = Utils;
