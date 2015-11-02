'use strict';

var chalk = require('chalk');

var ProgressReporter = function(logger) {
    this.logger = logger;
};

ProgressReporter.prototype.section = function(title) {
    title = chalk.white.bold(title);
    this.logger(title);
};

ProgressReporter.prototype.success = function(description) {
    description = chalk.bold.green('\u2713') + ' ' + chalk.gray(description);
    this.logger(description);
};

ProgressReporter.prototype.failure = function(description) {
    description = chalk.bold.red('\u2717') + ' ' + chalk.gray(description);
    this.logger(description);
};

ProgressReporter.prototype.failures = function(array, descriptionFn) {
    var self = this;
    array.forEach(function(object) {
        var description = descriptionFn(object);
        self.failure(description);
    });
};

module.exports = ProgressReporter;
