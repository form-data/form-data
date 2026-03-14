'use strict';

/*
 * Test RFC 5987 filename* encoding for special characters
 * re: https://github.com/form-data/form-data/issues/572
 */

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testFilenameWithParentheses() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'test(1).txt' });
  var buffer = form.getBuffer().toString();

  // Should contain both filename and filename* parameters
  assert(buffer.includes('filename="test(1).txt"'), 'Should have filename parameter');
  assert(buffer.includes("filename*=utf-8''test%281%29.txt"), 'Should have filename* with encoded parentheses');
}());

(function testFilenameWithSpaces() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'file name.txt' });
  var buffer = form.getBuffer().toString();

  // Should contain both filename and filename* parameters
  assert(buffer.includes('filename="file name.txt"'), 'Should have filename parameter');
  assert(buffer.includes("filename*=utf-8''file%20name.txt"), 'Should have filename* with encoded space');
}());

(function testSimpleFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'simple.txt' });
  var buffer = form.getBuffer().toString();

  // Should only have filename parameter (no encoding needed)
  assert(buffer.includes('filename="simple.txt"'), 'Should have filename parameter');
  assert(!buffer.includes('filename*='), 'Should NOT have filename* for simple names');
}());

(function testFilenameWithQuotes() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'test"quotes".txt' });
  var buffer = form.getBuffer().toString();

  // Should escape quotes in filename and encode in filename*
  assert(buffer.includes('filename="test\\"quotes\\".txt"'), 'Should escape quotes in filename');
  assert(buffer.includes("filename*=utf-8''test%22quotes%22.txt"), 'Should have filename* with encoded quotes');
}());

(function testFilenameWithBackslash() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'test\\slash.txt' });
  var buffer = form.getBuffer().toString();

  // Should escape backslash in filename
  assert(buffer.includes('filename="test\\\\slash.txt"'), 'Should escape backslash in filename');
  assert(buffer.includes("filename*=utf-8''test%5Cslash.txt"), 'Should have filename* with encoded backslash');
}());

(function testFilenameWithUnicode() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: '日本語.txt' });
  var buffer = form.getBuffer().toString();

  // Should have filename* with UTF-8 percent-encoded characters
  assert(buffer.includes('filename="日本語.txt"'), 'Should have filename parameter');
  assert(buffer.includes("filename*=utf-8''%E6%97%A5%E6%9C%AC%E8%AA%9E.txt"), 'Should have filename* with UTF-8 encoding');
}());

console.log('test-filename-encoding.js: All tests passed');
