import { IProject, IProjectResults, IFileMessages, IMap } from './interfaces';
import * as ts from 'typescript';
declare function compile(project: IProject, tsOptions: ts.CompilerOptions, lintOptions?: any, force?: boolean, verbose?: boolean, useProgram?: boolean): IMap<IFileMessages>;
declare function compileProject(projectName: string, tsPublishConfigPath: string, force?: boolean, verbose?: boolean, useProgram?: boolean): IProjectResults;
export { compile, compileProject };
