'use strict';

var request = require('request');
var cheerio = require('cheerio');

var config = require('./config');

var cookieJar = request.jar();

var EMAIL = process.env[config.auth.EMAIL_ENV_KEY];
var PASSWORD = process.env[config.auth.PASSWORD_ENV_KEY];

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

var Authenticator = {};

Authenticator.createSession = function(callback) {
    request(config.auth.LOGIN_URL, function(error, response, body) {
        errorCheck(error, 'login parsing:');

        var $ = cheerio.load(body);
        var CSRF = $('input').first().attr('value');

        var formData = { _csrf: CSRF, email: EMAIL, password: PASSWORD };

        request.post({ url: config.auth.SESSION_URL, form: formData, jar: cookieJar}, function(sessionError, sessionResponse, sessionBody) {
            errorCheck(sessionError, 'session creation');
            verifyHeaders(sessionResponse.headers);

            callback(cookieJar);
        });
    });
};

module.exports = Authenticator;
