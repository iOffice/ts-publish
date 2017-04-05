import { compile, compileProject } from './compiler';
import { readJSON, readTsPublish } from './config';
import {
  MessageCategory,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  TypedObject,
  IProject,
  IProjectResults,
} from './interfaces';
import { formatResults } from './formatter';
import { readFileSync, writeFileSync } from 'fs';
import * as fs from 'fs';
import * as pth from 'path';
import * as _ from 'lodash';

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

function changePackageVersion(version: string): void {
  const contents = readFileSync('package.json', 'utf8');
  const lines = contents.split('\n');
  const newLines = lines.map((line) => {
    if (_.startsWith(_.trim(line), '"version"')) {
      return `  "version": "${version}",`;
    }
    return line;
  });
  writeFileSync('package.json', newLines.join('\n'));
}

export {
  MessageCategory,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  IProjectResults,
  TypedObject,
  IProject,
  readJSON,
  readTsPublish,
  compile,
  compileProject,
  formatResults,
  move,
  changePackageVersion,
}
;
