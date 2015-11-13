'use strict';

var Resource = require('./resource');

var VERSION_PROPERTIES = ['version'];

var Version = function(properties) {
    Resource.call(this, properties, VERSION_PROPERTIES);
    this._type = 'version';
};

Version.prototype = Object.create(Resource.prototype);
Version.prototype.constructor = Version;

module.exports = Version;
