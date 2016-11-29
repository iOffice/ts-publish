#!/usr/bin/env node
"use strict";
require("colors");
var yargs = require("yargs");
var ts_publish_1 = require("ts-publish");
var path_1 = require("path");
var pkg = ts_publish_1.getConfig('package.json');
var argv = yargs.usage('usage: $0 hook-file')
    .demand(1)
    .help('help')
    .argv;
function main() {
    ts_publish_1.run('git status -s', function (stdout) {
        if (stdout) {
            ts_publish_1.info('ERROR'.red, "there are uncommitted changes:\n" + stdout);
            throw Error('exit');
        }
    });
    ts_publish_1.run("git branch | grep '^*' | sed 's/* //'", function (branch) {
        if (branch.trim() !== 'production') {
            ts_publish_1.info('ERROR'.red, "release only allowed in 'production' branch");
            throw Error('exit');
        }
    });
    var hook;
    var hookPath = path_1.normalize(process.cwd() + "/" + argv._[0]);
    try {
        hook = require(hookPath);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "unable to load hook '" + hookPath);
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.info('CHECKOUT'.cyan, 'build'.green);
    ts_publish_1.run('git checkout -b build');
    ts_publish_1.info('HOOK'.cyan, 'running ...');
    try {
        hook.hook('release');
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "hook error:\n'" + e.message + "'");
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.run('git status -s', function (stdout) {
        if (!stdout) {
            ts_publish_1.info('ERROR'.red, 'nothing to commit');
            throw Error('exit');
        }
    });
    try {
        hook.publish('release', pkg.version);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "hook publish error:\n'" + e.message + "'");
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.info('CHECKOUT'.cyan, 'master'.green);
    ts_publish_1.run('git checkout master');
    ts_publish_1.run('git branch -D build');
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
