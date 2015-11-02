'use strict';

var assert = require('chai').assert;
var simple = require('simple-mock');

var ProgressReporter = require('../lib/progressReporter.js');

var logger;
var progress;

describe('ProgressReporter', function() {
    beforeEach(function() {
        logger = simple.spy(function() { console.log.apply(null, [].slice.call(arguments)); });
        progress = new ProgressReporter(logger);
    });

    it('logs sections', function() {
        progress.section('Section 1');
        assert.match(logger.lastCall.arg, /Section/);
    });

    it('logs success', function() {
        progress.success('Task 1');
        assert.match(logger.lastCall.arg, /\u2713/);
    });

    it('logs a single failure', function() {
        progress.failure('Task 1');
        assert.match(logger.lastCall.arg, /\u2717/);
    });

    it('logs multiple failures', function() {
        progress.failures([{ title: 'Failure 1' }, { title: 'Failure 2' }], function(failed) {
            return failed.title;
        });

        assert.lengthOf(logger.calls, 2);
    });
});
