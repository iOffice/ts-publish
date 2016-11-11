import { IProject, IFileMessages, IMap } from './interfaces';
declare function getConfig(name: string, path?: string): any;
declare function parseTsPublishConfig(path: string): IProject[];
declare function loadModifiedFiles(project: IProject, targetDir: string, force?: boolean): string[];
declare function storeModifiedDates(project: IProject, results: IMap<IFileMessages>, emittedFiles: string[], targetDir: string): void;
export { getConfig, parseTsPublishConfig, loadModifiedFiles, storeModifiedDates };
