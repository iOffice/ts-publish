"use strict";
var compiler_1 = require("./compiler");
exports.compile = compiler_1.compile;
exports.compileProject = compiler_1.compileProject;
var cache_1 = require("./cache");
exports.getConfig = cache_1.getConfig;
exports.parseTsPublishConfig = cache_1.parseTsPublishConfig;
var formatter_1 = require("./formatter");
exports.formatResults = formatter_1.formatResults;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var fs = require("fs");
var pth = require("path");
var _ = require("lodash");
/**
 * Wrapper to output to the stdout stream. Unlike `console.log` this will not add the new line
 * character.
 */
function cout(msg) {
    process.stdout.write(msg);
}
exports.cout = cout;
/**
 * Wrapper to write formatted messages in the form `[:tag:] :msg:\n`.
 */
function info(tag, msg) {
    if (msg === void 0) { msg = ''; }
    process.stdout.write("[" + tag + "] " + msg + "\n");
}
exports.info = info;
/**
 * Calls `process.exit` with the exit code provided after a one second timeout. You may change
 * the timeout by providing the second parameter. The one second timeout is done because some
 * async processes (writing to the console) may not be completely done.
 *
 * See: https://github.com/nodejs/node/issues/7743
 */
function exit(code, timeout) {
    if (timeout === void 0) { timeout = 1000; }
    if (timeout) {
        setTimeout(function () { return process.exit(code); }, timeout);
    }
    else {
        process.exit(code);
    }
}
exports.exit = exit;
/**
 * Run a shell command. If a callback is provided then the resulting output from the command
 * is passed to it.
 */
function run(cmd, callback) {
    var out = child_process_1.execSync(cmd);
    if (callback) {
        return callback(out.toString()) || 0;
    }
    process.stdout.write(out.toString());
    return 0;
}
exports.run = run;
/**
 * Utility function to make a git tag and to push.
 */
function pushTags(tag) {
    info('TAGGING'.cyan);
    run("git tag " + tag);
    run('git push --tags');
}
exports.pushTags = pushTags;
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
/**
 * Move files and/or directories recursively. If the `src` parameter ends with `/` then only
 * the contents of the directory will be moved to the destination. Otherwise the whole `src`
 * directory will be moved to the destination.
 */
function move(src, dest) {
    var buf = [];
    _move(src, dest, buf);
    return buf;
}
exports.move = move;
function changePackageVersion(version) {
    var contents = fs_1.readFileSync('package.json', 'utf8');
    var lines = contents.split('\n');
    var newLines = lines.map(function (line) {
        if (_.startsWith(_.trim(line), '"version"')) {
            return "  \"version\": \"" + version + "\",";
        }
        return line;
    });
    fs_1.writeFileSync('package.json', newLines.join('\n'));
    run('git add package.json -f');
}
exports.changePackageVersion = changePackageVersion;
