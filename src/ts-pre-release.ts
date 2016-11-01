#!/usr/bin/env node
import { cout, exit, run, getConfig } from 'ts-publish';
import { readFileSync, writeFileSync } from 'fs';
import { normalize } from 'path';
import 'colors';
import * as yargs from 'yargs';
import * as _ from 'lodash';

interface IArgs {
  _: string[];
}

const pkg = getConfig('package');
const date = new Date();

function changeVersion(dateValue: number) {
  const contents = readFileSync('package.json', 'utf8');
  const lines = contents.split('\n');
  const newLines = lines.map((line) => {
    if (_.startsWith(_.trim(line), '"version"')) {
      return `  "version": "${pkg.version}-beta.${dateValue}",`;
    }
    return line;
  });
  writeFileSync('package.json', newLines.join('\n'));
}

const argv: IArgs = yargs.usage('usage: $0 hook-file')
  .demand(1)
  .help('help')
  .argv;

run('git status -s', (stdout: string) => {
  if (stdout) {
    cout(`${'[ERROR]'.red} there are uncommitted changes:\n${stdout}`);
    exit(0);
  }
});

run(`git branch | grep '^*' | sed 's/* //'`, (branch: string) => {
  if (branch.trim() !== 'master') {
    cout(`${'[ERROR]'.red} pre-release only allowed in 'master' branch\n`);
    exit(0);
  }
});

cout(`${'[CHECKOUT]'.cyan} ${'pre-release'.green}\n`);
run('git checkout pre-release');
run('git fetch --prune');
run('git reset --hard origin/master');

let hook: any;
const hookPath: string = normalize(`${process.cwd()}/${argv._[0]}`);
try {
  hook = require(hookPath);
} catch (e) {
  cout(`${'[ERROR]'.red} unable to load hook '${hookPath}'\n`);
  console.log(e.stack);
}

cout(`${'[HOOK]'.cyan} running...\n`);
try {
  hook.hook('pre-release');
} catch (e) {
  cout(`${'[ERROR]'.red} hook error:\n'${e.message}'\n`);
  console.log(e.stack);
  exit(0);
}

run('git status -s', (stdout: string) => {
  if (!stdout) {
    cout(`${'[ERROR]'.red} nothing to commit\n`);
    exit(0);
  }
});

cout(`${'[COMMIT]'.cyan}\n`);
changeVersion(date.valueOf());
run('git add package.json -f');
run(`git commit -m "[pre-release:${date.valueOf()}]"`);
run('git push origin pre-release -f');

cout(`${'[CHECKOUT]'.cyan} ${'master'.green}\n`);
run('git checkout master');

cout(`${'[DONE]'.green}\n`);
