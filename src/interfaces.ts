type MessageCategory = 'error' | 'warning' | 'info' | 'log' | 'debug';

interface ITSMessage {
  message: string;
  line: number;
  character: number;
  width: number;
  issuer: string;
  category: MessageCategory;
  type: string;
}

interface IFileInfo {
  fileName: string;
  absPath: string;
  emmittedFiles: string[];
  outDirectory: string;
}

interface IFileMessages extends IFileInfo {
  messages: ITSMessage[];
}

interface IFileStats extends IFileInfo {
  lastModified: number;
}

interface IProject {
  name: string;
  files: string[];
  stats?: {
    [index: string]: IFileStats
  };
  compilerOptions?: any;
}

interface IProjectResults {
  numMessages: number;
  numErrors: number;
  numWarnings: number;
  results: IMap<IFileMessages>;
}

interface IMap<T> {
  [index: string]: T;
}

export {
  MessageCategory,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  IFileStats,
  IMap,
  IProject,
  IProjectResults,
};
