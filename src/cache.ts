import { normalize } from 'path';
import { readFileSync, writeFileSync, statSync, Stats } from 'fs';
import { IProject, IFileMessages, IMap } from './interfaces';
import * as _ from 'lodash';

function _parseJSONFile(fileName: string): any {
  try {
    return JSON.parse(readFileSync(fileName, 'utf8'));
  } catch (e) {
    return null;
  }
}

function getConfig(name: string, path?: string): any {
  const base: string = path ? path : process.cwd();
  const config: string = `${base}/${name}.json`;
  return _parseJSONFile(config);
}

function parseTsPublishConfig(path: string) {
  const tsOptions = getConfig('tsconfig').compilerOptions;
  const projects: IProject[] = getConfig(path);
  _.each(projects, (project) => {
    if (project.compilerOptions) {
      const options = _.assign({}, tsOptions, project.compilerOptions);
      if (typeof options.target === 'string') {
        const typeMap: { [index: string]: number } = {
          es3: 0,
          es5: 1,
          es6: 2,
          es2015: 2,
        };
        options.target = typeMap[options.target as string];
      }
      project.compilerOptions = options;
    }
  });
  return projects;
}

function loadModifiedFiles(
  project: IProject,
  targetDir: string,
  force?: boolean
): string[] {
  const statsFile: string = `${targetDir}/.ts-stats.json`;
  let projectMap: IMap<IProject> = _parseJSONFile(statsFile) || {};
  let cached: boolean = true;
  if (!projectMap[project.name]) {
    projectMap[project.name] = {
      name: project.name,
      files: [],
      stats: {},
    };
    cached = false;
  }
  if (!cached || force) {
    return project.files;
  }

  const projectStats: IProject = projectMap[project.name];
  const filesToFilter: string[] = projectStats.files;
  _.each(project.files, (fileName) => {
    const nFileName: string = normalize(fileName);
    if (!_.find(filesToFilter, x => _.endsWith(normalize(x), nFileName))) {
      filesToFilter.push(nFileName);
      projectStats.stats![nFileName] = {
        fileName: nFileName,
        absPath: nFileName,
        emmittedFiles: [],
        outDirectory: '',
        lastModified: 0,
      };
    }
  });
  return _.filter(filesToFilter, (fileName) => {
    let stats: Stats;
    try {
      stats = statSync(fileName);
    } catch (e) {
      return false;
    }
    const lastModified: number = projectStats.stats![fileName].lastModified;
    return stats.mtime.valueOf() > lastModified;
  });
}

function storeModifiedDates(
  project: IProject,
  results: IMap<IFileMessages>,
  emittedFiles: string[],
  targetDir: string,
): void {
  const statsFile: string = `${targetDir}/.ts-stats.json`;
  let projectMap: IMap<IProject> = _parseJSONFile(statsFile) || {};
  if (!projectMap[project.name]) {
    projectMap[project.name] = {
      name: project.name,
      files: [],
      stats: {},
    };
  }
  const projectStats: IProject = projectMap[project.name];
  _.each(emittedFiles, (fileName) => {
    projectStats.files.push(fileName);
    const stats: Stats = statSync(fileName);
    const result: IFileMessages = _.find(results, (file: IFileMessages) => {
      return file.absPath === fileName;
    });
    if (result) {
      projectStats.stats![fileName] = {
        fileName: result.fileName,
        absPath: result.absPath,
        emmittedFiles: result.emmittedFiles,
        outDirectory: result.outDirectory,
        lastModified: result.messages.length ? 0 : stats.mtime.valueOf(),
      };
    }
  });
  projectStats.files = _.keys(projectStats.stats);
  writeFileSync(statsFile, JSON.stringify(projectMap, null, 2));
}

export {
  getConfig,
  parseTsPublishConfig,
  loadModifiedFiles,
  storeModifiedDates,
};
