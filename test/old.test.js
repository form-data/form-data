const fs = require('fs/promises');
const { join } = require('path');
const staticServer = require('./static');
const childProcess = require('child_process');

let httpServer;

beforeAll(async () => {
  // start static server for all tests
  httpServer = await new Promise((resolve) => staticServer(resolve));
})

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
})

it('should run all tests', async () => {
  // todo rewrite tests to jest
  const testFilesDir = join(__dirname, 'integration');
  const testFiles = await fs.readdir(testFilesDir);

  for (const testFile of testFiles) {
    const testFilePath = join(testFilesDir, testFile);
    console.log('running', testFile)
    await new Promise((resolve, reject) => {
      const cp = childProcess.fork(testFilePath);
      // https://github.com/facebook/jest/issues/3190
      // const cp = childProcess.spawn('nyc', ['--reporter', 'none', 'node', testFilePath])
      cp.on('error', reject);
      cp.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`code was ${code}`));
      })
    });
  }
}, 60000)
