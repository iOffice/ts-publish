#!/usr/bin/env node
import { run, cout, exit, getConfig, info } from 'ts-publish';
import { normalize, resolve } from 'path';
import 'colors';
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as _ from 'lodash';

interface IArgs {
  _: string[];
}

function fileExists(path: string): boolean {
  try {
    const stats = fs.statSync(path);
    return stats.isFile() || stats.isDirectory();
  } catch (e) {
    return false;
  }
}

function deleteFolderRecursive(path: string): void {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function main(): number {
  const pkg: any = getConfig('package.json');
  const argv: IArgs = yargs.usage('usage: $0 hook-file trial-project-path')
    .demand(2)
    .help('help')
    .argv;

  let hook: any;
  const hookPath: string = normalize(`${process.cwd()}/${argv._[0]}`);
  const trialProjectPath: string = normalize(argv._[1]);

  if (!fileExists(trialProjectPath)) {
    info('ERROR'.red, `Project path '${trialProjectPath}' does not exist`);
    return 1;
  }

  try {
    hook = require(hookPath);
  } catch (e) {
    info('ERROR'.red, `unable to load hook '${hookPath}`);
    console.log(e.stack);
    return 1;
  }

  const target = `${trialProjectPath}/node_modules/${pkg.name}`;

  info('REMOVING'.cyan, target);
  deleteFolderRecursive(target);
  fs.mkdirSync(target);

  const pkgFile = `${target}/package.json`;
  pkg.version += `-alpha.${new Date().valueOf()}`;
  info('ADDING-PACKAGE.JSON'.cyan, `version ${pkg.version}`);
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));

  info('HOOK'.cyan, 'running ...');
  try {
    hook.hook('trial', { target, pkg });
  } catch (e) {
    info('ERROR'.red, `hook error:\n'${e.message}'\n`);
    console.log(e.stack);
    return 0;
  }

  if (pkg.bin) {
    info('SYMLINK'.cyan, 'adding bin');
    _.each(pkg.bin, (x: string, name: string) => {
      const targetFile = resolve(normalize(`${target}/${x}`));
      const newFile = resolve(normalize(`${target}/../.bin/${name}`));
      cout(`  ${targetFile} -> ${newFile}\n`);
      try {
        fs.symlinkSync(targetFile, newFile);
      } catch (e) {}
      run(`chmod +x ${targetFile}`);
    });
  }

  info('DONE'.green);
  return 0;
}

exit(main());
