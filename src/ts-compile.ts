#!/usr/bin/env node
import {
  IProjectResults,
  formatResults,
  compileProject,
  exit,
} from 'ts-publish';
import * as yargs from 'yargs';

interface IArgs {
  _: string[];
  force: boolean;
  verbose: boolean;
  program: boolean;
  config: string;
}

const argv: IArgs = yargs.usage('usage: $0 project')
  .demand(1)
  .option('f', {
    alias: 'force',
    describe: 'force transpilation for all files in the project',
    type: 'boolean',
  })
  .option('v', {
    alias: 'verbose',
    describe: 'print debugging messages',
    type: 'boolean',
  })
  .option('p', {
    alias: 'program',
    describe: 'use the typescript program (only with TS > 2.0.7)',
    type: 'boolean',
  })
  .option('c', {
    alias: 'config',
    describe: 'path to configuration file',
    type: 'string',
  })
  .help('help')
  .argv;

function _compile(): number {
  let projectResult: IProjectResults;
  try {
    projectResult = compileProject(
      argv._[0], argv.config || 'ts-publish.json', argv.force, argv.verbose, argv.program,
    );
  } catch (e) {
    process.stderr.write(e.message);
    console.log(e.stack);
    return 2;
  }

  if (projectResult.numMessages) {
    process.stderr.write(formatResults(projectResult.results));
    if (projectResult.numErrors) {
      return 2;
    }
    return 1;
  }

  return 0;
}

exit(_compile());
