clean:
	rm -rf build

build: clean
	tsc

copy:
	rm -rf ./node_modules/ts-publish && cp -R ./build/ ./node_modules/ts-publish/

trial: build copy
	node ./build/ts-trial.js ./build/_hook.js $(TARGET)
