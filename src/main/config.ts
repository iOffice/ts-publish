import { readFileSync } from 'fs';
import { IProject } from './interfaces';
import * as _ from 'lodash';

function _parseJSONFile(fileName: string): any {
  try {
    return JSON.parse(readFileSync(fileName, 'utf8'));
  } catch (e) {
    return null;
  }
}

function readJSON(name: string, path?: string): any {
  const base: string = path || process.cwd();
  return _parseJSONFile(`${base}/${name}`);
}

function readTsPublish(path: string): IProject[] {
  const tsOptions = readJSON('tsconfig.json').compilerOptions;
  const projects: IProject[] = readJSON(path);
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

export {
  readJSON,
  readTsPublish,
};
