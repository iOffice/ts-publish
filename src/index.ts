import { compile, compileProject } from './compiler';
import { getConfig, parseTsPublishConfig } from './cache';
import {
  MessageCategory,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  IFileStats,
  IMap,
  IProject,
  IProjectResults,
} from './interfaces';
import { formatResults } from './formatter';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as pth from 'path';
import * as _ from 'lodash';

/**
 * Wrapper to output to the stdout stream. Unlike `console.log` this will not add the new line
 * character.
 */
function cout(msg: string): void {
  process.stdout.write(msg);
}

/**
 * Wrapper to write formatted messages in the form `[:tag:] :msg:\n`.
 */
function info(tag: string, msg: string = ''): void {
  process.stdout.write(`[${tag}] ${msg}\n`);
}

/**
 * Calls `process.exit` with the exit code provided after a one second timeout. You may change
 * the timeout by providing the second parameter. The one second timeout is done because some
 * async processes (writing to the console) may not be completely done.
 *
 * See: https://github.com/nodejs/node/issues/7743
 */
function exit(code: number, timeout: number = 1000): void {
  if (timeout) {
    setTimeout(() => process.exit(code), timeout);
  } else {
    process.exit(code);
  }
}

/**
 * Run a shell command. If a callback is provided then the resulting output from the command
 * is passed to it.
 */
function run(cmd: string, callback?: (output: string) => void | number): number {
  const out = execSync(cmd);
  if (callback) {
    return callback(out.toString()) || 0;
  }
  process.stdout.write(out.toString());
  return 0;
}

/**
 * Utility function to make a git tag and to push.
 */
function pushTags(tag: string): void {
  info('TAGGING'.cyan);
  run(`git tag ${tag} -f`);
  run('git push --tags -f');
}

function _move(src: string, dest: string, buf: string[]): void {
  const stats = fs.statSync(src);
  if (stats.isFile()) {
    buf.push(pth.normalize(dest));
    fs.renameSync(src, pth.normalize(dest));
  } else if (stats.isDirectory()) {
    if (_.endsWith(src, '/')) {
      // move directory contents
      const files = fs.readdirSync(src);
      _.each(files, (file) => {
        const filePath = pth.normalize(`${src}/${file}`);
        const destPath = pth.normalize(`${dest}/${file}`);
        const fileStats = fs.statSync(filePath);
        if (fileStats.isFile()) {
          buf.push(destPath);
          fs.renameSync(filePath, destPath);
        } else if (fileStats.isDirectory()) {
          try {
            fs.mkdirSync(destPath);
          } catch (e) {}
          _move(`${filePath}/`, destPath, buf);
          fs.rmdirSync(filePath);
        }
      });
    } else {
      // move whole directory
      const dirName = pth.basename(src);
      try {
        fs.mkdirSync(pth.normalize(`${dest}/${dirName}`));
      } catch (e) {}
      _move(`${src}/`, pth.normalize(`${dest}/${dirName}`), buf);
      fs.rmdirSync(src);
    }
  }
}

/**
 * Move files and/or directories recursively. If the `src` parameter ends with `/` then only
 * the contents of the directory will be moved to the destination. Otherwise the whole `src`
 * directory will be moved to the destination.
 */
function move(src: string, dest: string): string[] {
  const buf: string[] = [];
  _move(src, dest, buf);
  return buf;
}

export {
  MessageCategory,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  IFileStats,
  IProjectResults,
  IMap,
  IProject,
  getConfig,
  parseTsPublishConfig,
  compile,
  compileProject,
  formatResults,
  cout,
  exit,
  run,
  info,
  move,
  pushTags,
};
