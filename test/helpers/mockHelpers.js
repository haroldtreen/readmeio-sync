'use strict';

var simple = require('simple-mock');

var MockHelpers = {};

MockHelpers.spyOnPrototype = function(obj) {
    for (var prop in obj.prototype) {
        if (typeof obj.prototype[prop] === 'function') {
            obj.prototype[prop] = simple.spy(obj.prototype[prop]);
        }
    }
    return obj;
};

MockHelpers.override = function(obj, overrides) {
    Object.keys(overrides).forEach(function(key) {
        if (obj[key]) {
            obj[key] = overrides[key];
        } else {
            throw new TypeError(key + ' cannot be overriden!');
        }
    });
    return obj;
};

module.exports = MockHelpers;
