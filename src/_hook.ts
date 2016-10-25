import {
  formatResults,
  move,
  run,
  compileProject,
} from 'ts-publish';

function handleLib() {
  const projectResult = compileProject('ts-publish', './ts-publish', true);
  if (projectResult.numMessages) {
    process.stderr.write(formatResults(projectResult.results));
    throw Error('messages found');
  }

  const files = move('build/lib/*', '.');
  files.forEach((file) => {
    run(`git add ${file} -f`);
  });
}

function handleBin() {
  const projectResult = compileProject('bin', './ts-publish', true);
  if (projectResult.numMessages) {
    process.stderr.write(formatResults(projectResult.results));
    throw Error('messages found');
  }

  const files = move('build/bin/', '.');
  files.forEach((file) => {
    run(`git add ${file} -f`);
  });
}

function hook(): void {
  handleLib();
  handleBin();
}

export {
  hook,
}
