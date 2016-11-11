#!/usr/bin/env node
import 'colors';
import * as yargs from 'yargs';
import { exit, run, getConfig, info } from 'ts-publish';
import { normalize } from 'path';

interface IArgs {
  _: string[];
}

const pkg = getConfig('package.json');
const argv: IArgs = yargs.usage('usage: $0 hook-file')
  .demand(1)
  .help('help')
  .argv;

function main(): number {
  run('git status -s', (stdout: string) => {
    if (stdout) {
      info('ERROR'.red, `there are uncommitted changes:\n${stdout}`);
      throw Error('exit');
    }
  });

  run(`git branch | grep '^*' | sed 's/* //'`, (branch: string) => {
    if (branch.trim() !== 'master') {
      info('ERROR'.red, `pre-release only allowed in 'master' branch`);
      throw Error('exit');
    }
  });

  let hook: any;
  const hookPath: string = normalize(`${process.cwd()}/${argv._[0]}`);
  try {
    hook = require(hookPath);
  } catch (e) {
    info('ERROR'.red, `unable to load hook '${hookPath}`);
    console.log(e.stack);
    throw Error('exit');
  }

  info('CHECKOUT'.cyan, 'build'.green);
  run('git checkout -b build');

  info('HOOK'.cyan, 'running ...');
  try {
    hook.hook('pre-release');
  } catch (e) {
    info('ERROR'.red, `hook error:\n'${e.message}'`);
    console.log(e.stack);
    throw Error('exit');
  }

  run('git status -s', (stdout: string) => {
    if (!stdout) {
      info('ERROR'.red, 'nothing to commit');
      throw Error('exit');
    }
  });

  try {
    hook.publish('pre-release', pkg.version);
  } catch (e) {
    info('ERROR'.red, `hook publish error:\n'${e.message}'`);
    console.log(e.stack);
    throw Error('exit');
  }

  info('CHECKOUT'.cyan, 'master'.green);
  run('git checkout master');
  run('git branch -D build');

  info('DONE'.green);
  return 0;
}

try {
  exit(main());
} catch (e) {
  if (e.message !== 'exit') {
    info('UNKNOWN_ERROR'.red, e.message);
    console.log(e.stack);
  }
  exit(1);
}
