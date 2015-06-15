'use strict';

var fs = require('fs');
var js = require('jsonfile');

var loadConfig = function() {
    var configPath = process.env.TEST_MODE === true ? 'config/' : 'test/config/';
    var configs = {};

    var files = fs.readdirSync(configPath);

    files.forEach(function(file) {
        var match = file.match(/(.*)\.json$/);
        if (match) {
            configs[match[1]] = js.readFileSync(configPath + match[0]);
        }
    });
    return configs;
};

module.exports = loadConfig();
