'use strict';

var assert = require('chai').assert;
var CustomContent = require('../lib/resources/customContent');

describe('Custom Content', function() {
    it('sets specific properties', function() {
        var properties = {
            title: 'Test',
            excerpt: 'Excerpt',
            appearance: { html_body: '<html></html>', stylesheet: 'p { color: blue; }' }
        };

        var content = new CustomContent(properties);

        assert.isUndefined(content.title);
        assert.isUndefined(content.excerpt);
        assert.equal(content.appearance, properties.appearance);
    });

    it('has a type', function() {
        assert.equal(new CustomContent({}).getType(), 'customContent');
    });
});
