import { compile, compileProject } from './compiler';
import { getConfig, parseTsPublishConfig } from './cache';
import { MessageCategory, ITSMessage, IFileInfo, IFileMessages, IFileStats, IMap, IProject, IProjectResults } from './interfaces';
import { formatResults } from './formatter';
/**
 * Wrapper to output to the stdout stream. Unlike `console.log` this will not add the new line
 * character.
 */
declare function cout(msg: string): void;
/**
 * Wrapper to write formatted messages in the form `[:tag:] :msg:\n`.
 */
declare function info(tag: string, msg?: string): void;
/**
 * Calls `process.exit` with the exit code provided after a one second timeout. You may change
 * the timeout by providing the second parameter. The one second timeout is done because some
 * async processes (writing to the console) may not be completely done.
 *
 * See: https://github.com/nodejs/node/issues/7743
 */
declare function exit(code: number, timeout?: number): void;
/**
 * Run a shell command. If a callback is provided then the resulting output from the command
 * is passed to it.
 */
declare function run(cmd: string, callback?: (output: string) => void | number): number;
/**
 * Utility function to make a git tag and to push.
 */
declare function pushTags(tag: string): void;
/**
 * Move files and/or directories recursively. If the `src` parameter ends with `/` then only
 * the contents of the directory will be moved to the destination. Otherwise the whole `src`
 * directory will be moved to the destination.
 */
declare function move(src: string, dest: string): string[];
declare function changePackageVersion(version: string): void;
export { MessageCategory, ITSMessage, IFileInfo, IFileMessages, IFileStats, IProjectResults, IMap, IProject, getConfig, parseTsPublishConfig, compile, compileProject, formatResults, cout, exit, run, info, move, pushTags, changePackageVersion };
