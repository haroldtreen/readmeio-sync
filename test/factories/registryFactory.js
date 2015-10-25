'use strict';

var path = require('path');
var js = require('jsonfile');

var Registry = require('../../lib/registry');

var RegistryFactory = function() {
    return new Registry(js.readFileSync(path.join(__dirname, '/../fixtures/readmeContent.json')));
};

module.exports = RegistryFactory;
