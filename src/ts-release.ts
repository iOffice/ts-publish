#!/usr/bin/env node
import { cout, exit, run, getConfig } from 'ts-publish';
import { normalize } from 'path';
import 'colors';
import * as yargs from 'yargs';

interface IArgs {
  _: string[];
}

const pkg: any = getConfig('package');
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
  if (branch.trim() !== 'production') {
    cout(`${'[ERROR]'.red} release only allowed in 'production' branch\n`);
    exit(0);
  }
});

cout(`${'[CHECKOUT]'.cyan} ${'build'.green}\n`);
run('git checkout -b build');

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
  hook.hook('release');
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
run(`git commit -m "v${pkg.version}"`);

cout(`${'[TAG]'.cyan}\n`);
run(`git tag v${pkg.version} -f`);
run('git push --tags -f');

cout(`${'[CHECKOUT]'.cyan} ${'master'.green}\n`);
run('git checkout master');
run('git branch -D build');

cout(`${'[DONE]'.green}\n`);
