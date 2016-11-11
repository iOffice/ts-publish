"use strict";
var cache_1 = require('./cache');
var ts = require('typescript');
var Linter = require('tslint/lib/tslint');
var _ = require('lodash');
var fs = require('fs');
var ProgressBar = require('progress');
function cout(msg, verbose) {
    if (verbose) {
        console.log(msg);
    }
}
function getDiagnosticCategory(category) {
    var map = (_a = {},
        _a[ts.DiagnosticCategory.Error] = 'error',
        _a[ts.DiagnosticCategory.Warning] = 'warning',
        _a[ts.DiagnosticCategory.Message] = 'log',
        _a
    );
    return map[category];
    var _a;
}
function compile(project, tsOptions, lintOptions, force, verbose, useProgram) {
    var results = {};
    var outDirectory = tsOptions.outDir || '.';
    var modifiedFiles = cache_1.loadModifiedFiles(project, outDirectory, force);
    if (!modifiedFiles.length) {
        return results;
    }
    var servicesHost = {
        getScriptFileNames: function () { return modifiedFiles; },
        getScriptVersion: function (fileName) { return ''; },
        getCurrentDirectory: function () { return process.cwd(); },
        getScriptSnapshot: function (fileName) {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getCompilationSettings: function () { return tsOptions; },
        getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); }
    };
    var services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    cout("Creating program: " + project.name, verbose);
    _.each(modifiedFiles, function (x) { return cout("  - " + x, verbose); });
    var program = ts.createProgram(modifiedFiles, tsOptions);
    var emitResult = program.emit();
    var preDiagnostics = ts.getPreEmitDiagnostics(program);
    var allDiagnostics = preDiagnostics.concat(emitResult.diagnostics);
    var emittedFiles = program.getSourceFiles()
        .filter(function (x) { return !_.includes(x.fileName, 'node_modules'); });
    var lintConfig = {
        configuration: lintOptions,
        formatter: 'json'
    };
    var bar;
    if (verbose) {
        bar = new ProgressBar("  linting: :bar :percent :etas", {
            complete: '█',
            incomplete: '░',
            width: 50,
            total: emittedFiles.length
        });
    }
    _.each(emittedFiles, function (file) {
        if (verbose) {
            bar.tick();
        }
        if (!file || !file.fileName) {
            return;
        }
        var output = services.getEmitOutput(file.fileName);
        var fileName = file.fileName;
        if (!results[fileName]) {
            results[fileName] = {
                fileName: fileName,
                outDirectory: outDirectory,
                absPath: file.path,
                emmittedFiles: output.outputFiles.map(function (x) { return x.name; }),
                messages: []
            };
        }
        if (lintOptions) {
            var text = useProgram ? '' : file.text;
            var prog = useProgram ? program : undefined;
            var linter = new Linter(fileName, text, lintConfig, prog);
            var lintResults = linter.lint();
            var failures = JSON.parse(lintResults.output);
            var fileMessages_1 = results[fileName];
            _.each(failures, function (failure) {
                var _a = failure.startPosition, line = _a.line, character = _a.character;
                fileMessages_1.messages.push({
                    message: failure.failure,
                    line: line + 1,
                    character: character + 1,
                    width: 0,
                    issuer: 'tslint',
                    category: 'warning',
                    type: failure.ruleName
                });
            });
            fileMessages_1.messages.sort(function (a, b) { return a.line - b.line; });
        }
    });
    _.each(allDiagnostics, function (diagnostic) {
        var file = diagnostic.file;
        if (!file || !file.fileName) {
            return;
        }
        var fileMessages = results[file.fileName];
        var pos = file.getLineAndCharacterOfPosition(diagnostic.start);
        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '');
        if (fileMessages) {
            fileMessages.messages.push({
                message: message,
                line: pos.line + 1,
                character: pos.character + 1,
                width: 0,
                issuer: 'typescript',
                category: getDiagnosticCategory(diagnostic.category),
                type: "TS" + diagnostic.code
            });
            fileMessages.messages.sort(function (a, b) { return a.line - b.line; });
        }
    });
    cache_1.storeModifiedDates(project, results, emittedFiles.map(function (x) { return x.path; }), outDirectory);
    return results;
}
exports.compile = compile;
function compileProject(projectName, tsPublishConfigPath, force, verbose, useProgram) {
    var projects = cache_1.parseTsPublishConfig(tsPublishConfigPath);
    if (!projects) {
        throw Error("something seems to be wrong with '" + tsPublishConfigPath + "'\n");
    }
    var project = _.find(projects, function (x) { return x.name === projectName; });
    if (!project) {
        throw Error("project must be one of: [" + projects.map(function (x) { return x.name; }) + "]\n");
    }
    var lintOptions = cache_1.getConfig(project.tsLintConfigPath || 'tslint.json');
    var results = compile(project, project.compilerOptions, lintOptions, force, verbose, useProgram);
    var output = {
        results: results,
        numMessages: 0,
        numErrors: 0,
        numWarnings: 0
    };
    _.each(results, function (file) {
        output.numMessages += file.messages.length;
        _.each(file.messages, function (msg) {
            if (msg.category === 'error') {
                output.numErrors += 1;
            }
            else if (msg.category === 'warning') {
                output.numWarnings += 1;
            }
        });
    });
    return output;
}
exports.compileProject = compileProject;
