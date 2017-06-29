type MessageCategory = 'error' | 'warning' | 'info' | 'log' | 'debug';
type TypedObject<T> = { [key: string]: T };

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
  outDirectory: string;
}

interface IFileMessages extends IFileInfo {
  messages: ITSMessage[];
}

interface IProject {
  name: string;
  files: string[];
  libraries?: string[];
  compilerOptions?: any;
  tsLintConfigPath?: string;
}

interface IProjectResults {
  numMessages: number;
  numErrors: number;
  numWarnings: number;
  results: TypedObject<IFileMessages>;
}

export {
  MessageCategory,
  TypedObject,
  ITSMessage,
  IFileInfo,
  IFileMessages,
  IProject,
  IProjectResults,
};
