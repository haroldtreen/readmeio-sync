'use strict';

var chalk = require('chalk');
var utils = require('./utils');

var ProgressReporter = function(logger) {
    this.logger = logger;
};

ProgressReporter.resourceKeys = ['html_body', 'stylesheet'];

var descriptionFn = function(text) { return chalk.gray(text); };

var reports = {
    header: {
        prefix: function() { return ''; },
        description: function(text) { return chalk.white.bold(text); }
    },
    section: {
        prefix: function() { return ''; },
        description: function(text) { return chalk.white(text); }
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
    ProgressReporter.prototype[report] = function(text, indent) {
        indent = indent || '';
        var settings = reports[report];
        var line = indent + settings.prefix(text) + settings.description(text);
        this.logger(line);
    };
});

ProgressReporter.prototype.reportResultsArray = function(resources, indent) {
    var self = this;
    resources.forEach(function(resource) {
        if (resource.error) {
            self.failure(resource.toString(), indent);
        } else {
            self.success(resource.toString(), indent);
        }
    });
};

ProgressReporter.prototype.reportResultsObject = function(resource, indent) {
    var self = this;
    Object.keys(resource).forEach(function(key) {
        if (ProgressReporter.resourceKeys.indexOf(key) > -1) {
            self.success(key, indent);
        } else {
            if (utils.isVersion(key)) { self.section(key, indent); }
            self.reportResourceResults(resource[key], indent);
        }
    });
};

ProgressReporter.prototype.reportResourceResults = function(resource, indent) {
    indent = indent ? indent + '  ' : '  ';
    if (Array.isArray(resource)) {
        this.reportResultsArray(resource, indent);
    } else if (typeof resource === 'object') {
        this.reportResultsObject(resource, indent);
    } else if (resource === true) {
        this.success('Success', indent);
    } else if (resource === false) {
        this.failure('Failure', indent);
    }
};

module.exports = ProgressReporter;
