clean:
	rm -rf build

build: clean
	tsc

test: build
	mocha build/test/index.js --timeout 15000

selfBuild: build
	node build/main/ts-compile.js ts-publish --verbose

release:
	bash release.sh
