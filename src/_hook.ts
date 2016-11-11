import {
  formatResults,
  move,
  run,
  cout,
  compileProject,
  pushTags,
  changePackageVersion,
} from 'ts-publish';

function handleLib(action: string, target: string) {
  const projectResult = compileProject('ts-publish', './ts-publish.json', true, true);
  if (projectResult.numMessages) {
    cout(formatResults(projectResult.results));
    throw Error('messages found');
  }

  if (action === 'trial') {
    move('build/lib/', target);
  } else {
    const files = move('build/lib/', '.');
    files.forEach((file) => {
      run(`git add ${file} -f`);
    });
  }
}

function handleBin(action: string, target: string) {
  const projectResult = compileProject('bin', './ts-publish.json', true, true);
  if (projectResult.numMessages) {
    cout(formatResults(projectResult.results));
    throw Error('messages found');
  }

  if (action === 'trial') {
    move('build/bin', target);
  } else {
    run('rm -rf ./bin');
    const files = move('build/bin', '.');
    files.forEach((file) => {
      run(`git add ${file} -f`);
    });
  }
}

function hook(action: string, options?: any): void {
  const target = options ? options.target : '';
  handleLib(action, target);
  handleBin(action, target);
}

function publish(action: string, version: string): void {
  const date = new Date();
  const finalVersion = action === 'pre-release' ? `${version}-beta.${date.valueOf()}` : version;
  cout(`Publishing version ${finalVersion}\n`);
  if (action === 'pre-release') {
    changePackageVersion(finalVersion);
    run(`git commit -m "[pre-release] v${finalVersion}"`);
  } else {
    run(`git commit -m "[release] v${finalVersion}"`);
  }
  pushTags(`v${finalVersion}`);
  run('npm publish');
}

export {
  hook,
  publish,
}
