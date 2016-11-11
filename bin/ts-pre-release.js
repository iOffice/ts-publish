#!/usr/bin/env node
"use strict";
require('colors');
var yargs = require('yargs');
var _ = require('lodash');
var ts_publish_1 = require('ts-publish');
var fs_1 = require('fs');
var path_1 = require('path');
var pkg = ts_publish_1.getConfig('package.json');
var date = new Date();
var argv = yargs.usage('usage: $0 hook-file')
    .demand(1)
    .help('help')
    .argv;
function changeVersion(dateValue) {
    var contents = fs_1.readFileSync('package.json', 'utf8');
    var lines = contents.split('\n');
    var newLines = lines.map(function (line) {
        if (_.startsWith(_.trim(line), '"version"')) {
            return "  \"version\": \"" + pkg.version + "-beta." + dateValue + "\",";
        }
        return line;
    });
    fs_1.writeFileSync('package.json', newLines.join('\n'));
    return pkg.version + "-beta." + dateValue;
}
function main() {
    ts_publish_1.run('git status -s', function (stdout) {
        if (stdout) {
            ts_publish_1.info('ERROR'.red, "there are uncommitted changes:\n" + stdout);
            throw Error('exit');
        }
    });
    ts_publish_1.run("git branch | grep '^*' | sed 's/* //'", function (branch) {
        if (branch.trim() !== 'master') {
            ts_publish_1.info('ERROR'.red, "pre-release only allowed in 'master' branch");
            throw Error('exit');
        }
    });
    ts_publish_1.info('CHECKOUT'.cyan, 'build'.green);
    ts_publish_1.run('git checkout -b build');
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
    ts_publish_1.info('HOOK'.cyan, 'running ...');
    try {
        hook.hook('pre-release');
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
    ts_publish_1.info('COMMIT'.cyan);
    var version = changeVersion(date.valueOf());
    ts_publish_1.run('git add package.json -f');
    ts_publish_1.run("git commit -m \"[pre-release:" + date.valueOf() + "]\"");
    try {
        hook.publish('pre-release', version);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "hook publish error:\n'" + e.message + "'");
        console.log(e.stack);
        throw Error('exit');
    }
    ts_publish_1.info('TAG'.cyan);
    ts_publish_1.run("git tag v" + version + " -f");
    ts_publish_1.run('git push --tags -f');
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
