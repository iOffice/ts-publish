"use strict";
var compiler_1 = require('./compiler');
exports.compile = compiler_1.compile;
exports.compileProject = compiler_1.compileProject;
var cache_1 = require('./cache');
exports.getConfig = cache_1.getConfig;
exports.parseTsPublishConfig = cache_1.parseTsPublishConfig;
var formatter_1 = require('./formatter');
exports.formatResults = formatter_1.formatResults;
var child_process_1 = require('child_process');
var fs = require('fs');
var pth = require('path');
var _ = require('lodash');
function cout(msg) {
    process.stdout.write(msg);
}
exports.cout = cout;
function info(tag, msg) {
    if (msg === void 0) { msg = ''; }
    process.stdout.write("[" + tag + "] " + msg + "\n");
}
exports.info = info;
function exit(code, timeout) {
    if (timeout === void 0) { timeout = 1000; }
    // Waiting one second before exiting to finish any ongoing async processes.
    // https://github.com/nodejs/node/issues/7743
    if (timeout) {
        setTimeout(function () { return process.exit(code); }, timeout);
    }
    else {
        process.exit(code);
    }
}
exports.exit = exit;
function run(cmd, callback) {
    var out = child_process_1.execSync(cmd);
    if (callback) {
        return callback(out.toString());
    }
    process.stdout.write(out.toString());
    return 0;
}
exports.run = run;
function _move(src, dest, buf) {
    var stats = fs.statSync(src);
    if (stats.isFile()) {
        buf.push(pth.normalize(dest));
        fs.renameSync(src, pth.normalize(dest));
    }
    else if (stats.isDirectory()) {
        if (_.endsWith(src, '/')) {
            // move directory contents
            var files = fs.readdirSync(src);
            _.each(files, function (file) {
                var filePath = pth.normalize(src + "/" + file);
                var destPath = pth.normalize(dest + "/" + file);
                var fileStats = fs.statSync(filePath);
                if (fileStats.isFile()) {
                    buf.push(destPath);
                    fs.renameSync(filePath, destPath);
                }
                else if (fileStats.isDirectory()) {
                    try {
                        fs.mkdirSync(destPath);
                    }
                    catch (e) { }
                    _move(filePath + "/", destPath, buf);
                    fs.rmdirSync(filePath);
                }
            });
        }
        else {
            // move whole directory
            var dirName = pth.basename(src);
            try {
                fs.mkdirSync(pth.normalize(dest + "/" + dirName));
            }
            catch (e) { }
            _move(src + "/", pth.normalize(dest + "/" + dirName), buf);
            fs.rmdirSync(src);
        }
    }
}
function move(src, dest) {
    var buf = [];
    _move(src, dest, buf);
    return buf;
}
exports.move = move;
