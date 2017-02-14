#!/bin/bash

npm update

VERSION=$(node --eval "console.log(require('./package.json').version);")

make selfBuild || exit 1
make test || exit 1

echo "Ready to publish ts-publish version $VERSION."
echo "Has the version number been bumped?"
read -n1 -r -p "Press Ctrl+C to cancel, or any other key to continue." key

git checkout -b build

echo "Creating git tag v$VERSION..."

git push --tags -f

echo "Uploading to NPM..."

npm publish

git checkout master
git branch -D build

echo "All done."
