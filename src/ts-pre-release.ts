#!/usr/bin/env node
import 'colors';
import * as yargs from 'yargs';
import * as _ from 'lodash';
import { exit, run, getConfig, info } from 'ts-publish';
import { readFileSync, writeFileSync } from 'fs';
import { normalize } from 'path';

interface IArgs {
  _: string[];
}

const pkg = getConfig('package.json');
const date = new Date();
const argv: IArgs = yargs.usage('usage: $0 hook-file')
  .demand(1)
  .help('help')
  .argv;

function changeVersion(dateValue: number): string {
  const contents = readFileSync('package.json', 'utf8');
  const lines = contents.split('\n');
  const newLines = lines.map((line) => {
    if (_.startsWith(_.trim(line), '"version"')) {
      return `  "version": "${pkg.version}-beta.${dateValue}",`;
    }
    return line;
  });
  writeFileSync('package.json', newLines.join('\n'));
  return `${pkg.version}-beta.${dateValue}`;
}

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

  info('CHECKOUT'.cyan, 'build'.green);
  run('git checkout -b build');

  let hook: any;
  const hookPath: string = normalize(`${process.cwd()}/${argv._[0]}`);
  try {
    hook = require(hookPath);
  } catch (e) {
    info('ERROR'.red, `unable to load hook '${hookPath}`);
    console.log(e.stack);
    throw Error('exit');
  }

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

  info('COMMIT'.cyan);
  const version = changeVersion(date.valueOf());
  run('git add package.json -f');
  run(`git commit -m "[pre-release:${date.valueOf()}]"`);

  try {
    hook.publish('pre-release', version);
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
