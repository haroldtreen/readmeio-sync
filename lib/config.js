'use strict';

var js = require('jsonfile');

var loadConfig = function() {
    var config;
    var configPath = process.env.TEST_MODE !== true ? 'config.json' : 'test/config.json';

    try {
        config = js.readFileSync(configPath);
    } catch (err) {
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
        throw err;
    }

    config.projectName = process.env.PRODUCTION === true ? config.projectNames.production : config.projectNames.staging;

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
