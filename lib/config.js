'use strict';

var fs = require('fs');
var js = require('jsonfile');

var loadConfig = function() {
    var config = {};
    var configPath = process.env.TEST_MODE !== 'true' ? 'syncConfig.json' : 'test/fixtures/syncConfig.json';
    var registryPath = process.env.TEST_MODE !== 'true' ? 'syncRegistry.json' : 'test/fixtures/syncRegistry.json';
    var logger = process.env.TEST_MODE !== 'true' ? console.log : function(string) {};
    var isProduction = process.env.PRODUCTION === 'true';

    if (fs.existsSync(configPath)) {
        config = js.readFileSync(configPath);

        config.projectName = isProduction ? config.projectNames.production : config.projectNames.staging;
    } else if (!fs.existsSync(configPath) && process.argv[2] !== 'config') {
        var exampleJson = {
            projectNames: {
                production: '<production_project_slug>',
                staging: '<staging_project_slug>'
            }
        };
        console.log('Config file not found!');
        console.log('Make sure you have a \'config.json\' file at your project root.');
        console.log('It should look like this:');
        console.log(JSON.stringify(exampleJson, null, 4));
    }

    config.log = logger;
    config.path = configPath;
    config.registryPath = registryPath;
    config.auth = {
        'LOGIN_URL': 'https://dash.readme.io/login',
        'SESSION_URL': 'https://dash.readme.io/users/session',
        'EMAIL_ENV_KEY': 'README_EMAIL',
        'PASSWORD_ENV_KEY': 'README_PASSWORD'
    };

    config.apiBase = 'https://dash.readme.io';

    return config;
};

module.exports = loadConfig();
