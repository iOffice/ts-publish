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
  config: string;
}

const argv: IArgs = yargs.usage('usage: $0 project')
  .demand(1)
  .option('f', {
    alias: 'force',
    describe: 'force transpilation for all files in the project',
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
    projectResult = compileProject(argv._[0], argv.config || 'ts-publish', argv.force);
  } catch (e) {
    process.stderr.write(e.message);
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
