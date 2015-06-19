'use strict';

var js = require('jsonfile');

var loadConfig = function() {
    var configPath = process.env.TEST_MODE !== true ? 'config.json' : 'test/config.json';
    var config = js.readFileSync(configPath);

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
