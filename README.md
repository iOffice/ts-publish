## ts-publish

This repo is collection of node scripts written to aid in the deployment of typescript projects.
There are three main scripts provided: `ts-compile`, `ts-pre-release` and `ts-release`.

### ts-compile

This is meant to be a replacement for `tsc`. To use we need to provide a `ts-publish.json` file.
The contents of the file should be an array containing the information for the projects that need
to be compiled. For instance:

```json
[
  {
    "name": "project-name",
    "files": [
      "src/file1.ts",
      "src/file2.ts
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

To compile all the files for `build-tools` we can do

```
ts-compile build-tools --config path/to/ts-publish
```

Make sure to not include the `.json` extension when specifying the configuration file.

### ts-pre-release

This script helps us to test our code in the wild. It will build the code and place it in the
`pre-release` branch. To use it we need to be in the `master` branch and run

```
ts-pre-release path/to/hook/file.js
```

Note that we need to provide a js file. This file should declare a `hook` function which
compiles the typescript files and adds them to `git`. For instance:

```typescript
import {
  formatResults,
  move,
  run,
  compileProject,
} from 'ts-publish';

function hook(): void {
  const projectResult = compileProject('project-name', './build-tools/ts-publish', true);
  if (projectResult.numMessages) {
    process.stderr.write(formatResults(projectResult.results));
    // throw Error('messages found');
  }

  const files = move('build/lib/*', '.');
  files.forEach((file) => {
    run(`git add ${file} -f`);
  });
}

export {
  hook,
}

```

NOTE: Before running this command make sure that the `pre-release` branch already exists. This is
a branch that needs to be set up along with the `production` branch.

### ts-release

This script works in the same way as the pre-release one. With the exception that it can only
be ran in the `production` branch. You may also provide the same hook file if you wish. The script
will call it with the string argument `release`. With this info you may be able to call
`npm publish` only when the release script is ran.
