'use strict';

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testTypeIsBuffer() {
  var form = new FormData();
  form.append('String', 'Some random string');
  var buffer = form.getBuffer();

  assert.equal(typeof buffer === 'object' && Buffer.isBuffer(buffer), true);
}());

(function testBufferIsValid() {
  var form = new FormData();

  var stringName = 'String';
  var stringValue = 'This is a random string';
  var intName = 'Int';
  var intValue = 1549873167987;
  var bufferName = 'Buffer';
  var bufferValue = Buffer.from([0x00, 0x4a, 0x45, 0x46, 0x46, 0x52, 0x45, 0x59, 0x255]);

  // Fill the formData object
  form.append(stringName, stringValue);
  form.append(intName, intValue);
  form.append(bufferName, bufferValue);

  // Get the resulting Buffer
  var buffer = form.getBuffer();

  // Generate expected code.
  var boundary = form.getBoundary();
  var expected = Buffer.concat([
    Buffer.from('--' + boundary + FormData.LINE_BREAK + 'Content-Disposition: form-data; name="' + stringName + '"' + FormData.LINE_BREAK + FormData.LINE_BREAK + stringValue + FormData.LINE_BREAK + '--' + boundary + FormData.LINE_BREAK + 'Content-Disposition: form-data; name="' + intName + '"' + FormData.LINE_BREAK + FormData.LINE_BREAK + intValue + FormData.LINE_BREAK + '--' + boundary + FormData.LINE_BREAK + 'Content-Disposition: form-data; name="' + bufferName + '"' + FormData.LINE_BREAK + 'Content-Type: application/octet-stream' + FormData.LINE_BREAK + FormData.LINE_BREAK),
    bufferValue,
    Buffer.from(FormData.LINE_BREAK + '--' + boundary + '--' + FormData.LINE_BREAK)
  ]);

  // Test if the buffer content, equals the expected buffer.
  assert.equal(buffer.length, expected.length);
  assert.equal(buffer.toString('hex'), expected.toString('hex'));
}());

// RFC 5987: Test filename* encoding for special characters (issue #572)
(function testRfc5987Encoding() {
  var form = new FormData();

  // Test with parentheses - characters that must be encoded per RFC 5987
  form.append('file', Buffer.from('test content'), 'test(1).txt');

  var buffer = form.getBuffer();
  var content = buffer.toString();

  // Should include both filename and filename* parameters
  assert(content.includes('filename="test(1).txt"'), 'Should include basic filename');
  assert(content.includes("filename*=utf-8''test%281%29.txt"), 'Should include RFC 5987 encoded filename*');
}());

// RFC 5987: Normal filenames should not include filename*
(function testNoRfc5987ForNormal() {
  var form = new FormData();

  // Test with normal filename - no special characters
  form.append('file', Buffer.from('test content'), 'normal.txt');

  var buffer = form.getBuffer();
  var content = buffer.toString();

  // Should only include basic filename, not filename*
  assert(content.includes('filename="normal.txt"'), 'Should include basic filename');
  assert(!content.includes('filename*'), 'Should NOT include filename* for simple names');
}());

// RFC 5987: Test with spaces and unicode
(function testRfc5987Spaces() {
  var form = new FormData();

  form.append('file', Buffer.from('test'), 'my document.pdf');

  var buffer = form.getBuffer();
  var content = buffer.toString();

  // Space is not in attr-char, so should trigger encoding
  assert(content.includes('filename="my document.pdf"'), 'Should include basic filename');
  assert(content.includes("filename*=utf-8''my%20document.pdf"), 'Should encode space');
}());
