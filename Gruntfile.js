'use strict';

var exec = require('child_process').exec;

module.exports = function(grunt) {

    // Add the grunt-mocha-test tasks.
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');

    grunt.initConfig({
        // Configure a mochaTest task
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false, // Optionally clear the require cache before running tests (defaults to false)
                    require: [function() { process.env.TEST_MODE = 'true'; }]
                },
                src: ['test/**/*.js']
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test/*.js', // a folder works nicely
                options: {
                    mask: '*Spec.js'
                }
            }
        }
    });

    grunt.registerTask('setTestMode', function() {
        process.env.TEST_MODE = 'true';
    });

    grunt.registerTask('sendToCoveralls', function() {
        exec('cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js', function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Report Sent!');
            }
        });
    });


    grunt.registerTask('coverage', ['setTestMode', 'mocha_istanbul:coverage']);
    grunt.registerTask('coveralls', 'coverage', 'sendToCoveralls');
    grunt.registerTask('test', 'mochaTest');

};
