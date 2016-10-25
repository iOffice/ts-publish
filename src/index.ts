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

function cout(msg: string): void {
  process.stdout.write(msg);
}

function exit(code: number): void {
  process.exit(code);
}

function run(cmd: string, callback?: Function): void {
  const out = execSync(cmd);
  if (callback) {
    callback(out.toString());
  } else {
    process.stdout.write(out.toString());
  }
}

function move(source: string, dest: string): string[] {
  const result = execSync(`mv ${source} ${dest} --verbose`).toString();
  const lines = result.split('\n').filter(x => x);
  return lines.map((line) => {
    const name = line.split('->')[1].trim();
    return name.substr(1, name.length - 2);
  });
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
  move,
};
