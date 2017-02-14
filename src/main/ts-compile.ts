#!/usr/bin/env node
import {
  IProjectResults,
  formatResults,
  compileProject,
} from './index';

const verbose = process.argv.indexOf('--verbose') > -1;
const noLint = process.argv.indexOf('--no-lint') > -1;

function _compile(): number {
  let projectResult: IProjectResults;
  try {
    projectResult = compileProject(
      process.argv[2], 'ts-publish.json', noLint ? 'no-lint' : '', verbose,
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

const exitNumber = _compile();
process.on('exit', () => {
  process.exit(exitNumber);
});
