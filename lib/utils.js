'use strict';

var Utils = {};

Utils.markdownCodeRegex = /```([a-z]+)\n((?:[^`]|(?:\\`))+)```/g;
Utils.readmeCodeRegex = /\[block:code\]\s*{\s*"codes":\s*\[\s*{\s*"code":\s*"(.*)",\s*"language":\s*"(.*)"\s*}\s*\]\s*\}\s*\[\/block\]/g;

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

module.exports = Utils;
