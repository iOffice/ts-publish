clean:
	rm -rf build

build: clean
	tsc

test: build
	mocha build/test/index.js --timeout 15000

copy:
	rm -rf ./node_modules/ts-publish && cp -R ./build/ ./node_modules/ts-publish/
