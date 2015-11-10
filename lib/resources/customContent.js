'use strict';

var CONTENT_PROPERTIES = ['appearance'];

var CustomContent = function(properties) {
    var self = this;
    this._type = 'customContent';
    Object.keys(properties).forEach(function(key) {
        if (CONTENT_PROPERTIES.indexOf(key) > -1) {
            self[key] = properties[key];
        }
    });
};

CustomContent.prototype.getType = function() {
    return this._type;
};


module.exports = CustomContent;
