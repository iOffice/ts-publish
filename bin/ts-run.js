#!/usr/bin/env node
"use strict";
require("colors");
var yargs = require("yargs");
var ts_publish_1 = require("ts-publish");
var path_1 = require("path");
var pkg = ts_publish_1.getConfig('package.json');
var argv = yargs.usage('usage: $0 -f fn -c path/to/config')
    .option('f', {
    alias: 'fn',
    describe: 'function to run',
    type: 'string'
})
    .option('c', {
    alias: 'config',
    describe: 'path to configuration file',
    type: 'string'
})
    .help('help')
    .argv;
function main() {
    var hook;
    var hookPath = path_1.normalize(process.cwd() + "/" + argv.config);
    try {
        hook = require(hookPath);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "unable to load hook '" + hookPath);
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.info('HOOK'.cyan, "running " + argv.fn + " ...");
    try {
        hook[argv.fn](pkg);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "hook error:\n'" + e.message + "'");
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.info('DONE'.green);
    return 0;
}
try {
    ts_publish_1.exit(main());
}
catch (e) {
    if (e.message !== 'exit') {
        ts_publish_1.info('UNKNOWN_ERROR'.red, e.message);
        console.log(e.stack);
    }
    ts_publish_1.exit(1);
}
