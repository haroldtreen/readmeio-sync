'use strict';

var chalk = require('chalk');

var ProgressReporter = function(logger) {
    this.logger = logger;
};

var descriptionFn = function(text) { return chalk.gray(text); };

var reports = {
    section: {
        prefix: function() { return ''; },
        description: function(text) { return chalk.white.bold(text); }
    },
    success: {
        prefix: function() { return chalk.bold.green('\u2713') + ' '; },
        description: descriptionFn
    },
    failure: {
        prefix: function() { return chalk.bold.red('\u2717') + ' '; },
        description: descriptionFn
    }
};

Object.keys(reports).forEach(function(report) {
    ProgressReporter.prototype[report] = function(text) {
        var settings = reports[report];
        var line = settings.prefix(text) + settings.description(text);
        this.logger(line);
    };
});

ProgressReporter.prototype.failures = function(array, descriptionFn) {
    var self = this;
    array.forEach(function(object) {
        var description = descriptionFn(object);
        self.failure(description);
    });
};

module.exports = ProgressReporter;
