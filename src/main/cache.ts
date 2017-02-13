import { readFileSync } from 'fs';
import { IProject } from 'ts-publish';
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
  const config: string = `${base}/${name}`;
  return _parseJSONFile(config);
}

function parseTsPublishConfig(path: string): IProject[] {
  const tsOptions = getConfig('tsconfig.json').compilerOptions;
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

export {
  getConfig,
  parseTsPublishConfig,
};
