import { readJSON, readTsPublish } from '../main/config';
import { expect, assert } from 'chai';

describe('JSON files', () => {
  it('should return null with invalid json files', () => {
    const content = readJSON('invalid-json.json', 'src/test/fixtures');
    assert(content === null);
  });

  it('should parse the json file', () => {
    const content = readJSON('valid-json.json', 'src/test/fixtures');
    assert(content['valid']);
  });

  it('should read the package.json file', () => {
    const content = readJSON('package.json');
    expect(content['name']).to.equal('ts-publish');
  });

  it('should read the ts-publish.json file', () => {
    const content = readTsPublish('ts-publish.json');
    expect(content[0]['compilerOptions']['target']).to.equal(1);
  });
});
