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

    it('logs headers', function() {
        progress.header('Header 1');
        assert.match(logger.lastCall.arg, /Header/);
    });

    it('logs success', function() {
        progress.success('Task 1');
        assert.match(logger.lastCall.arg, /\u2713/);
    });

    it('logs a single failure', function() {
        progress.failure('Task 1');
        assert.match(logger.lastCall.arg, /\u2717/);
    });

    it('logs arrays', function() {
        progress.reportResultsArray([{error: 'failed', title: 'Doc'}, { title: 'Doc 2' }]);

        assert.lengthOf(logger.calls, 2);
        assert.match(logger.calls[0].arg, /\u2717/);
        assert.match(logger.calls[1].arg, /\u2713/);
    });

    it('logs objects', function() {
        progress.reportResultsObject({
            html_body: '<html></html>',
            stylesheet: '.id { }',
            'v2.0': [{toString: function() { return 'Doc'; }}]
        });

        assert.lengthOf(logger.calls, 4);
        [/html_body/, /stylesheet/, /v2\.0/, /Doc/].forEach(function(regex, index) {
            assert.match(logger.calls[index].arg, regex);
        });
    });
});
