#! /usr/bin/env node

'use strict';

var program = require('commander');

var Cli = require('./lib/cli');

program.version('0.5.0');

program
    .command('init')
    .description('Initialize a local readmeio project that can be synced')
    .action(function() {
        Cli.init();
    });

program
    .command('upload')
    .description('uploads the files specified in syncRegistry.json to readmeio')
    .option('-p, --production', 'Use production project')
    .action(function(options) {
        Cli.upload(options);
    });

program
    .command('config')
    .description('Set the project name configurations for the project')
    .option('-s, --staging [staging]', 'set the staging project name')
    .option('-p, --production [production]', 'set the production project name')
    .action(function(options) {
        Cli.config(options);
    });

program
    .command('clean-remote')
    .description('Deletes all Readme.io content not listed in the registry')
    .option('-p, --production', 'Clean the production project')
    .option('-a, --aggressive', 'Clean all docs')
    .action(function(options) {
        Cli.clean(options);
    });


program.parse(process.argv);
