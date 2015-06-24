#! /usr/bin/env node

'use strict';

var program = require('commander');

var Cli = require('./lib/cli');

program.version('0.5.0');

program
    .command('init')
    .description('initialize a local readmeio project that can be synced')
    .action(function() {
        console.log('Init!');
    });

program
    .command('upload')
    .description('uploads the files specified in syncRegistry.json to readmeio')
    .option('-P, --production', 'Use production project')
    .action(function(options) {
        Cli.upload(options);
    });

program
    .command('config')
    .description('set the project name configurations for the project')
    .option('-s, --staging [staging]', 'set the staging project name')
    .option('-p, --production [production]', 'set the production project name')
    .action(function(options) {
        console.log('Config!');
        console.log(options);
    });

program.parse(process.argv);
