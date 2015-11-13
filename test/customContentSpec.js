'use strict';

var assert = require('chai').assert;
var CustomContent = require('../lib/resources/customContent');

describe('Custom Content', function() {
    var contentProperties = {
        appearance: { html_body: '<html></html>', stylesheet: 'p { color: blue; }' }
    };
    it('sets specific properties', function() {
        var content = new CustomContent(contentProperties);

        assert.isUndefined(content.title);
        assert.isUndefined(content.excerpt);
        assert.equal(content.appearance, contentProperties.appearance);
    });

    it('has a type', function() {
        assert.equal(new CustomContent({}).getType(), 'customContent');
    });

    it('has a toString()', function() {
        var content = new CustomContent(contentProperties);

        assert.equal(content.toString(), '');

        content.version = 'v1.0';
        assert.equal(content.toString(), 'v1.0 -');

        content.method = 'delete';
        assert.equal(content.toString(), 'DELETE: v1.0 -');
    });
});
