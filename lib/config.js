'use strict';

var fs = require('fs');
var js = require('jsonfile');

var loadConfig = function() {
    var config = {};
    var notTest = process.env.TEST_MODE !== 'true';
    var isProduction = process.env.PRODUCTION === 'true';

    var configPath = notTest ? 'syncConfig.json' : 'test/fixtures/syncConfig.json';
    var registryPath = notTest ? 'syncRegistry.json' : 'test/fixtures/syncRegistry.json';
    var syncSettingsPath = notTest ? 'syncSettings.json' : 'test/fixtures/syncSettings.json';
    var logger = notTest ? console.log : function() {};

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
    config.syncSettingsPath = syncSettingsPath;
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
