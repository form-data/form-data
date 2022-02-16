const fs = require('fs').promises;
const { join } = require('path');
const childProcess = require('child_process');

const staticServer = require('./static');

let httpServer;

beforeAll(async () => {
  // start static server for all tests
  httpServer = await staticServer();
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

// todo rewrite tests to jest
it('should run old tests', async () => {
  const testFilesDir = join(__dirname, 'old');
  const testFiles = await fs.readdir(testFilesDir);

  for (const testFile of testFiles) {
    const testFilePath = join(testFilesDir, testFile);
    // eslint-disable-next-line no-console
    console.log('running', testFile);
    await new Promise((resolve, reject) => {
      const cp = childProcess.fork(testFilePath);
      // https://github.com/facebook/jest/issues/3190
      // const cp = childProcess.spawn('nyc', ['--reporter', 'none', 'node', testFilePath])
      cp.on('error', reject);
      cp.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`code was ${code}`));
      });
    });
  }
}, 60000);
