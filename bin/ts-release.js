#!/usr/bin/env node
"use strict";
var ts_publish_1 = require('ts-publish');
var path_1 = require('path');
require('colors');
var yargs = require('yargs');
var pkg = ts_publish_1.getConfig('package');
var argv = yargs.usage('usage: $0 hook-file')
    .demand(1)
    .help('help')
    .argv;
ts_publish_1.run('git status -s', function (stdout) {
    if (stdout) {
        ts_publish_1.cout('[ERROR]'.red + " there are uncommitted changes:\n" + stdout);
        ts_publish_1.exit(0);
    }
});
ts_publish_1.run("git branch | grep '^*' | sed 's/* //'", function (branch) {
    if (branch.trim() !== 'production') {
        ts_publish_1.cout('[ERROR]'.red + " release only allowed in 'production' branch\n");
        ts_publish_1.exit(0);
    }
});
ts_publish_1.cout('[CHECKOUT]'.cyan + " " + 'build'.green + "\n");
ts_publish_1.run('git checkout -b build');
var hook;
var hookPath = path_1.normalize(process.cwd() + "/" + argv._[0]);
try {
    hook = require(hookPath);
}
catch (e) {
    ts_publish_1.cout('[ERROR]'.red + " unable to load hook '" + hookPath + "'\n");
    console.log(e.stack);
}
ts_publish_1.cout('[HOOK]'.cyan + " running...\n");
try {
    hook.hook('release');
}
catch (e) {
    ts_publish_1.cout('[ERROR]'.red + " hook error:\n'" + e.message + "'\n");
    console.log(e.stack);
    ts_publish_1.exit(0);
}
ts_publish_1.run('git status -s', function (stdout) {
    if (!stdout) {
        ts_publish_1.cout('[ERROR]'.red + " nothing to commit\n");
        ts_publish_1.exit(0);
    }
});
ts_publish_1.cout('[COMMIT]'.cyan + "\n");
ts_publish_1.run("git commit -m \"v" + pkg.version + "\"");
ts_publish_1.cout('[TAG]'.cyan + "\n");
ts_publish_1.run("git tag v" + pkg.version + " -f");
ts_publish_1.run('git push --tags -f');
ts_publish_1.cout('[CHECKOUT]'.cyan + " " + 'master'.green + "\n");
ts_publish_1.run('git checkout master');
ts_publish_1.run('git branch -D build');
ts_publish_1.cout('[DONE]'.green + "\n");
