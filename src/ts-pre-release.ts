#!/usr/bin/env node
import { cout, exit, run } from 'ts-publish';
import { normalize } from 'path';
import 'colors';
import * as yargs from 'yargs';

interface IArgs {
  _: string[];
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
}

cout(`${'[HOOK]'.cyan} running...\n`);
try {
  hook.hook('pre-release');
} catch (e) {
  cout(`${'[ERROR]'.red} hook error:\n'${e.message}'\n`);
  exit(0);
}

run('git status -s', (stdout: string) => {
  if (!stdout) {
    cout(`${'[ERROR]'.red} nothing to commit\n`);
    exit(0);
  }
});

cout(`${'[COMMIT]'.cyan}\n`);
run('git commit -m "pre-release"');
run('git push origin pre-release -f');

cout(`${'[CHECKOUT]'.cyan} ${'master'.green}\n`);
run('git checkout master');

cout(`${'[DONE]'.green}\n`);
