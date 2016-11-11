## ts-publish

This package provides a collection of node scripts to aid in the deployment of typescript projects.

### Configuration

You may provide a configuration file called `ts-publish.json`. This file has the following
structure:

```json
[
  {
    "name": "project-name",
    "files": [
      "src/file1.ts",
      "src/file2.ts"
    ],
    "libraries": [
      "files/to/always/be/included.ts"
    ],
    "compilerOptions": {
      "outDir": "./build/lib",
      "declaration": true
    }
  },
  {
    "name": "build-tools",
    "files": [
      "build-tools/ts-hook.ts",
      "build-tools/karma.config.ts",
      "build-tools/webpack.config.ts"
    ],
    "compilerOptions": {
      "outDir": "./build"
    }
  }
]
```

In the above example we have an array declaring two projects. One is the main project and the other
one is a "build-tools" project which is in charge of compiling all of our project tools. Note that
on the "build-tools" project we did not include the "libraries" option. This is optional and should
only be used if you want certain files to always be included in the transpilation. One example of
such files would be files that contains declarations.

At the moment all the paths are set relative to the root directory. We should also note that each
ts-publish.json file reads the `tsconfig.json` file to look for the compilerOptions. These options
should be general enough to fit every project. This is done

### ts-compile

This is meant to be a replacement for `tsc`. To use it we need to make sure to have a
`ts-publish.json` file available.

To compile all the files for `build-tools` do

```
ts-compile build-tools
```

If the configuration file has a different name we can specify it

```
ts-compile build-tools --config path/to/config-file.json
```

### hook file

Before we can run any of the next three scripts we will have to define a hook file and make
sure that it is compiled via `ts-compile`. This file should export a function named `hook` and
`publish` with the following signatures:

```typescript
function hook(action: string, options?: any): void;
function publish(action: string, version: string): void;
```

The string `action` will be one of the following: `['pre-release', 'release', 'trial']`. When
action is `trial`, the options object will provide the property `target` which is the path
to another projects' node_modules directory.

The publish function is ran once a git commit has been made. This is the time to run `npm publish`
if you wish.

### ts-trial

This script takes in two parameters: the path to the hook file and the path to the project which
will try the package. To begin to understand how to use this file lets start by writing the
following hook file

```typescript
// ts-hook.ts
import {
  formatResults,
  move,
  run,
  cout,
  compileProject,
} from 'ts-publish';

function hook(action: string, options?: any): void {
  const target = options ? options.target : '';
  const projectResult = compileProject('<PROJECT_NAME>', './ts-publish.json', true, true);
    if (projectResult.numMessages) {
      cout(formatResults(projectResult.results));
      throw Error('messages found');
    }

    if (action === 'trial') {
      cout('This is a trial, here we should copy the compiled files to the target directory\n');
      // move('build/lib/', target);
    } else {
      // Lets be careful here, here we can insert code for the cases when `action` is
      // release or pre-release
      // In the next lines we move the compiled files to the root directory and commit them.

      // const files = move('build/lib/', '.');
      // files.forEach((file) => {
      //   run(`git add ${file} -f`);
      // });
    }
}

export {
  hook,
}
```

After compiling the file we can try it out

```
ts-trial path/to/hook-file.js path/to/trial/project
```

This should print a message only.

### ts-pre-release

This script helps us test our code in the wild. To use it we need to be in the `master` branch and
run

```
ts-pre-release path/to/hook-file.js
```

Note that this will modify package.json and change the version by appending `-beta.<date>`. In
this way we will obtain a unique version for the package. This will also tag the commit and push
to Github.

### ts-release

This script works in the same way as the pre-release one. With the exception that it can only
be ran in the `production` branch. You may also provide the same hook file if you wish. The script
will call it with the string argument `release`. Note that this script does not modify the package
version.
