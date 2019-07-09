[![Downloads per Month](https://img.shields.io/npm/dm/ts-publish.svg)](https://www.npmjs.com/package/ts-publish)
[![NPM Version](https://img.shields.io/npm/v/ts-publish.svg)](https://www.npmjs.com/package/ts-publish)
[![Shields.io](https://img.shields.io/badge/badges%20by-shields.io-ff69b4.svg)](https://shields.io/)
[![License](https://img.shields.io/npm/l/ts-publish.svg)](LICENSE)

# DEPRECATED

Replaced by private project. Published contents can be found on npm `@ioffice/tc-builder`.

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
should be general enough to fit every project.

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
