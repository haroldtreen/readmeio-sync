'use strict';

var Resource = require('./resource');

var CUSTOM_CONTENT_PROPERTIES = ['appearance'];

var CustomContent = function(properties) {
    Resource.call(this, properties, CUSTOM_CONTENT_PROPERTIES);
    this._type = 'customContent';
};

CustomContent.prototype = Object.create(Resource.prototype);
CustomContent.prototype.constructor = CustomContent;

module.exports = CustomContent;
