#!/usr/bin/env node
import 'colors';
import * as yargs from 'yargs';
import { exit, getConfig, info } from 'ts-publish';
import { normalize } from 'path';

interface IArgs {
  _: string[];
  fn: string;
  config: string;
}
const pkg = getConfig('package.json');
const argv: IArgs = yargs.usage('usage: $0 -f fn -c path/to/config')
  .option('f', {
    alias: 'fn',
    describe: 'function to run',
    type: 'string',
  })
  .option('c', {
    alias: 'config',
    describe: 'path to configuration file',
    type: 'string',
  })
  .help('help')
  .argv;

function main(): number {
  let hook: any;
  const hookPath: string = normalize(`${process.cwd()}/${argv.config}`);
  try {
    hook = require(hookPath);
  } catch (e) {
    info('ERROR'.red, `unable to load hook '${hookPath}`);
    console.log(e.stack);
    throw Error('exit');
  }

  info('HOOK'.cyan, `running ${argv.fn} ...`);
  try {
    hook[argv.fn](pkg);
  } catch (e) {
    info('ERROR'.red, `hook error:\n'${e.message}'`);
    console.log(e.stack);
    throw Error('exit');
  }

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
