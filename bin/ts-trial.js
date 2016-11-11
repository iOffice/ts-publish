#!/usr/bin/env node
"use strict";
var ts_publish_1 = require('ts-publish');
var path_1 = require('path');
require('colors');
var yargs = require('yargs');
var fs = require('fs');
var _ = require('lodash');
function fileExists(path) {
    try {
        var stats = fs.statSync(path);
        return stats.isFile() || stats.isDirectory();
    }
    catch (e) {
        return false;
    }
}
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
function main() {
    var pkg = ts_publish_1.getConfig('package.json');
    var argv = yargs.usage('usage: $0 hook-file trial-project-path')
        .demand(2)
        .help('help')
        .argv;
    var hook;
    var hookPath = path_1.normalize(process.cwd() + "/" + argv._[0]);
    var trialProjectPath = path_1.normalize(argv._[1]);
    if (!fileExists(trialProjectPath)) {
        ts_publish_1.info('ERROR'.red, "Project path '" + trialProjectPath + "' does not exist");
        return 1;
    }
    try {
        hook = require(hookPath);
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "unable to load hook '" + hookPath);
        console.log(e.stack);
        return 1;
    }
    var target = trialProjectPath + "/node_modules/" + pkg.name;
    ts_publish_1.info('REMOVING'.cyan, target);
    deleteFolderRecursive(target);
    fs.mkdirSync(target);
    var pkgFile = target + "/package.json";
    pkg.version += "-alpha." + new Date().valueOf();
    ts_publish_1.info('ADDING-PACKAGE.JSON'.cyan, "version " + pkg.version);
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
    ts_publish_1.info('HOOK'.cyan, 'running ...');
    try {
        hook.hook('trial', { target: target, pkg: pkg });
    }
    catch (e) {
        ts_publish_1.info('ERROR'.red, "hook error:\n'" + e.message + "'\n");
        console.log(e.stack);
        return 0;
    }
    if (pkg.bin) {
        ts_publish_1.info('SYMLINK'.cyan, 'adding bin');
        _.each(pkg.bin, function (x, name) {
            var targetFile = path_1.resolve(path_1.normalize(target + "/" + x));
            var newFile = path_1.resolve(path_1.normalize(target + "/../.bin/" + name));
            ts_publish_1.cout("  " + targetFile + " -> " + newFile + "\n");
            try {
                fs.symlinkSync(targetFile, newFile);
            }
            catch (e) { }
            ts_publish_1.run("chmod +x " + targetFile);
        });
    }
    ts_publish_1.info('DONE'.green);
    return 0;
}
ts_publish_1.exit(main());
