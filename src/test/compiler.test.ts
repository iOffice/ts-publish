import { compileProject } from '../main/compiler';
import { expect } from 'chai';

describe('compiler', () => {
  it('should throw an error if there is no valid project', () => {
    const fn = () => {
      compileProject('not-found', 'src/test/fixtures/ts-publish.json');
    };
    expect(fn).to.throw(
      // tslint:disable-next-line
      'project must be one of: [test-only-errors,test-only-warnings,test-both-errors-and-warnings,test-valid]\n',
    );
  });

  it('should compile with no messages', () => {
    const results = compileProject('test-valid', 'src/test/fixtures/ts-publish.json');
    expect(results.numMessages).to.equal(0);
  });

  it('should compile with errors', () => {
    const results = compileProject('test-only-errors', 'src/test/fixtures/ts-publish.json');
    expect(results.numMessages).to.equal(1);
    expect(results.numErrors).to.equal(1);
    expect(results.numWarnings).to.equal(0);
  });

  it('should compile with warnings', () => {
    const results = compileProject(
      'test-only-warnings',
      'src/test/fixtures/ts-publish.json',
      'src/test/fixtures/tslint.json',
    );
    expect(results.numMessages).to.equal(1);
    expect(results.numErrors).to.equal(0);
    expect(results.numWarnings).to.equal(1);
  });

  it('should compile with both errors and warnings', () => {
    const results = compileProject(
      'test-both-errors-and-warnings',
      'src/test/fixtures/ts-publish.json',
      'src/test/fixtures/tslint.json',
    );
    expect(results.numMessages).to.equal(2);
    expect(results.numErrors).to.equal(1);
    expect(results.numWarnings).to.equal(1);
  });
});
