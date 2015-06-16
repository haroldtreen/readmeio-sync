'use strict';

module.exports = (function() {
    var request = require('request');
    var fs = require('fs');
    var cheerio = require('cheerio');

    var cookieJar = request.jar();

    var authenticator = {};
    var configs = JSON.parse(fs.readFileSync('config/auth.json'));

    authenticator.configs = configs;

    configs.EMAIL = process.env[configs.EMAIL_ENV_KEY];
    configs.PASSWORD = process.env[configs.PASSWORD_ENV_KEY];

    var errorCheck = function(error, stepDescription) {
        if (error) {
            console.log('Something went wrong during ' + stepDescription + ':');
            throw error;
        }
    };

    var verifyHeaders = function(headers) {
        // If our authentication fails, the request is redirected without error
        // Need to verify that this hasn't happened for a successful request
        if (headers.location === '/login') {
            throw 'Error: Request failed! (Redirected to login...)';
        }
    };

    authenticator.createSession = function(callback) {
        request(configs.LOGIN_URL, function(error, response, body) {
            errorCheck(error, 'login parsing:');

            var $ = cheerio.load(body);
            var CSRF = $('input').first().attr('value');

            var formData = { _csrf: CSRF, email: configs.EMAIL, password: configs.PASSWORD };

            request.post({ url: configs.SESSION_URL, form: formData, jar: cookieJar}, function(sessionError, sessionResponse, sessionBody) {
                errorCheck(sessionError, 'session creation');
                verifyHeaders(sessionResponse.headers);

                callback(cookieJar);
            });
        });
    };

    return authenticator;
}());
