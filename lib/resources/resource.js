'use strict';


var Resource = function(properties, validProperties) {
    var self = this;
    if (!validProperties || !properties) {
        return;
    }
    validProperties.forEach(function(property) {
        self[property] = properties[property];
    });
};

Resource.prototype.stringProperties = {
    method: function(method) { return method.toUpperCase() + ': '; },
    version: function(version) { return version + ' - '; },
    title: function(title) { return title + ' '; },
    slug: function(slug) { return '<' + slug + '> '; },
    pages: function(pages) { return '(' + pages.length + ' docs)'; }
};

Resource.prototype.getType = function() {
    return this._type;
};

Resource.prototype.toString = function() {
    var self = this;
    var msg = '';
    Object.keys(self.stringProperties).forEach(function(prop) {
        var value = self[prop];
        if (value) {
            msg += self.stringProperties[prop](value);
        }
    });
    return msg.trim();
};

module.exports = Resource;
