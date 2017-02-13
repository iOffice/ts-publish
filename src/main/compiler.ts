import {
  MessageCategory,
  IProject,
  IProjectResults,
  IFileMessages,
  ITSMessage,
  IMap,
} from 'ts-publish';
import {
  getConfig,
  parseTsPublishConfig,
} from './cache';
import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as ProgressBar from 'progress';

function cout(msg: string, verbose?: boolean): void {
  if (verbose) {
    console.log(msg);
  }
}

function getDiagnosticCategory(category: ts.DiagnosticCategory): MessageCategory {
  const map: { [key: number]: MessageCategory } = {
    [ts.DiagnosticCategory.Error]: 'error',
    [ts.DiagnosticCategory.Warning]: 'warning',
    [ts.DiagnosticCategory.Message]: 'log',
  };
  return map[category];
}

function compile(
  project: IProject,
  tsOptions: ts.CompilerOptions,
  lintOptions?: any,
  verbose?: boolean,
  useProgram?: boolean,
): IMap<IFileMessages> {
  const results: IMap<IFileMessages> = {};
  const outDirectory: string = tsOptions.outDir || '.';
  const modifiedFiles: string[] = project.files;

  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => modifiedFiles,
    getScriptVersion: () => '',
    getCurrentDirectory: () => process.cwd(),
    getScriptSnapshot: (fileName) => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }

      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCompilationSettings: () => tsOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  };

  const services: ts.LanguageService = ts.createLanguageService(
    servicesHost,
    ts.createDocumentRegistry(),
  );

  cout(`Creating program: ${project.name}`, verbose);
  _.each(modifiedFiles, x => cout(`  - ${x}`, verbose));
  const program: ts.Program = ts.createProgram(modifiedFiles, tsOptions);
  const emitResult: ts.EmitResult = program.emit();
  const preDiagnostics: ts.Diagnostic[] = ts.getPreEmitDiagnostics(program);
  const allDiagnostics: ts.Diagnostic[] = preDiagnostics.concat(emitResult.diagnostics);
  const emittedFiles: ts.SourceFile[] = program.getSourceFiles()
    .filter(x => !_.includes(x.fileName, 'node_modules'));

  const options: Lint.ILinterOptions = {
    fix: false,
    formatter: 'json',
  };
  let bar: ProgressBar | undefined;
  if (verbose) {
    bar = new ProgressBar(`  linting: :bar :percent :etas`, {
      complete: '█',
      incomplete: '░',
      width: 50,
      total: emittedFiles.length,
    });
  }
  _.each(emittedFiles, (file) => {
    if (verbose) {
      bar!.tick();
    }
    if (!file || !file.fileName) {
      return;
    }
    const output: ts.EmitOutput = services.getEmitOutput(file.fileName);
    const fileName: string = file.fileName;
    if (!results[fileName]) {
      results[fileName] = {
        fileName,
        outDirectory,
        absPath: file.path,
        emmittedFiles: output.outputFiles.map(x => x.name),
        messages: [],
      };
    }

    if (lintOptions) {
      const text = useProgram ? '' : file.text;
      const prog = useProgram ? program : undefined;
      const linter = new Lint.Linter(options, prog);
      linter.lint(fileName, text, lintOptions);
      const lintResults: Lint.LintResult = linter.getResult();
      const failures: any = JSON.parse(lintResults.output);
      const fileMessages: IFileMessages = results[fileName];
      _.each(failures, (failure) => {
        const { line, character }: any = failure.startPosition;
        fileMessages.messages.push({
          message: failure.failure,
          line: line + 1,
          character: character + 1,
          width: 0,
          issuer: 'tslint',
          category: 'warning',
          type: failure.ruleName,
        });
      });
      fileMessages.messages.sort((a, b) => a.line - b.line);
    }
  });

  _.each(allDiagnostics, (diagnostic) => {
    const file: ts.SourceFile = diagnostic.file;
    if (!file || !file.fileName) {
      return;
    }
    const fileMessages: IFileMessages = results[file.fileName];
    const pos: ts.LineAndCharacter = file.getLineAndCharacterOfPosition(diagnostic.start);
    const message: string = ts.flattenDiagnosticMessageText(diagnostic.messageText, '');
    if (fileMessages) {
      fileMessages.messages.push({
        message,
        line: pos.line + 1,
        character: pos.character + 1,
        width: 0,
        issuer: 'typescript',
        category: getDiagnosticCategory(diagnostic.category),
        type: `TS${diagnostic.code}`,
      });
      fileMessages.messages.sort((a, b) => a.line - b.line);
    }
  });

  return results;
}

function compileProject(
  projectName: string,
  tsPublishConfigPath: string,
  verbose?: boolean,
  useProgram?: boolean,
): IProjectResults {
  const projects: IProject[] = parseTsPublishConfig(tsPublishConfigPath);
  if (!projects) {
    throw Error(`something seems to be wrong with '${tsPublishConfigPath}'\n`);
  }
  const project: IProject = _.find(projects, (x) => x.name === projectName)!;
  if (!project) {
    throw Error(`project must be one of: [${projects.map(x => x.name)}]\n`);
  }
  const lintOptions: any = getConfig(project.tsLintConfigPath || 'tslint.json');
  const results = compile(
    project, project.compilerOptions, lintOptions, verbose, useProgram,
  );
  const output: IProjectResults = {
    results,
    numMessages: 0,
    numErrors: 0,
    numWarnings: 0,
  };
  _.each(results, (file: IFileMessages) => {
    output.numMessages += file.messages.length;
    _.each(file.messages, (msg: ITSMessage) => {
      if (msg.category === 'error') {
        output.numErrors += 1;
      } else if (msg.category === 'warning') {
        output.numWarnings += 1;
      }
    });
  });
  return output;
}

export {
  compile,
  compileProject,
};
