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

function cout(msg: string): void {
  process.stdout.write(msg);
}

function info(tag: string, msg: string): void {
  process.stdout.write(`[${tag}] ${msg}\n`);
}

function exit(code: number, timeout: number = 1000): void {
  // Waiting one second before exiting to finish any ongoing async processes.
  // https://github.com/nodejs/node/issues/7743
  if (timeout) {
    setTimeout(() => process.exit(code), timeout);
  } else {
    process.exit(code);
  }
}

function run(cmd: string, callback?: Function): void {
  const out = execSync(cmd);
  if (callback) {
    callback(out.toString());
  } else {
    process.stdout.write(out.toString());
  }
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
};
