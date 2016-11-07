"use strict";
var path_1 = require('path');
var fs_1 = require('fs');
var _ = require('lodash');
function _parseJSONFile(fileName) {
    try {
        return JSON.parse(fs_1.readFileSync(fileName, 'utf8'));
    }
    catch (e) {
        return null;
    }
}
function getConfig(name, path) {
    var base = path ? path : process.cwd();
    var config = base + "/" + name;
    return _parseJSONFile(config);
}
exports.getConfig = getConfig;
function parseTsPublishConfig(path) {
    var tsOptions = getConfig('tsconfig.json').compilerOptions;
    var projects = getConfig(path);
    _.each(projects, function (project) {
        if (project.compilerOptions) {
            var options = _.assign({}, tsOptions, project.compilerOptions);
            if (typeof options.target === 'string') {
                var typeMap = {
                    es3: 0,
                    es5: 1,
                    es6: 2,
                    es2015: 2
                };
                options.target = typeMap[options.target];
            }
            project.compilerOptions = options;
        }
    });
    return projects;
}
exports.parseTsPublishConfig = parseTsPublishConfig;
function loadModifiedFiles(project, targetDir, force) {
    var statsFile = targetDir + "/.ts-stats.json";
    var projectMap = _parseJSONFile(statsFile) || {};
    var cached = true;
    if (!projectMap[project.name]) {
        projectMap[project.name] = {
            name: project.name,
            files: [],
            stats: {}
        };
        cached = false;
    }
    if (!cached || force) {
        return project.files;
    }
    var projectStats = projectMap[project.name];
    var filesToFilter = projectStats.files;
    _.each(project.files, function (fileName) {
        var nFileName = path_1.normalize(fileName);
        if (!_.find(filesToFilter, function (x) { return _.endsWith(path_1.normalize(x), nFileName); })) {
            filesToFilter.push(nFileName);
            projectStats.stats[nFileName] = {
                fileName: nFileName,
                absPath: nFileName,
                emmittedFiles: [],
                outDirectory: '',
                lastModified: 0
            };
        }
    });
    return _.filter(filesToFilter, function (fileName) {
        var stats;
        try {
            stats = fs_1.statSync(fileName);
        }
        catch (e) {
            return false;
        }
        var lastModified = projectStats.stats[fileName].lastModified;
        return stats.mtime.valueOf() > lastModified;
    });
}
exports.loadModifiedFiles = loadModifiedFiles;
function storeModifiedDates(project, results, emittedFiles, targetDir) {
    var statsFile = targetDir + "/.ts-stats.json";
    var projectMap = _parseJSONFile(statsFile) || {};
    if (!projectMap[project.name]) {
        projectMap[project.name] = {
            name: project.name,
            files: [],
            stats: {}
        };
    }
    var projectStats = projectMap[project.name];
    _.each(emittedFiles, function (fileName) {
        projectStats.files.push(fileName);
        var stats = fs_1.statSync(fileName);
        var result = _.find(results, function (file) {
            return file.absPath === fileName;
        });
        if (result) {
            projectStats.stats[fileName] = {
                fileName: result.fileName,
                absPath: result.absPath,
                emmittedFiles: result.emmittedFiles,
                outDirectory: result.outDirectory,
                lastModified: result.messages.length ? 0 : stats.mtime.valueOf()
            };
        }
    });
    projectStats.files = _.keys(projectStats.stats);
    fs_1.writeFileSync(statsFile, JSON.stringify(projectMap, null, 2));
}
exports.storeModifiedDates = storeModifiedDates;
