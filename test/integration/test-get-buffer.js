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

(function testManyFields() {
  var form = new FormData();
  var boundary = form.getBoundary();
  var parts = [];
  var count = 1000;

  for (var i = 0; i < count; i++) {
    var name = 'field' + i;
    if (i % 2 === 0) {
      var value = 'value ' + i;
      form.append(name, value);
      parts.push(Buffer.from('--' + boundary + FormData.LINE_BREAK + 'Content-Disposition: form-data; name="' + name + '"' + FormData.LINE_BREAK + FormData.LINE_BREAK + value + FormData.LINE_BREAK));
    } else {
      var bufferValue = Buffer.from([i % 256, 0x00, 0xff, 0x0d, 0x0a]);
      form.append(name, bufferValue);
      parts.push(Buffer.from('--' + boundary + FormData.LINE_BREAK + 'Content-Disposition: form-data; name="' + name + '"' + FormData.LINE_BREAK + 'Content-Type: application/octet-stream' + FormData.LINE_BREAK + FormData.LINE_BREAK));
      parts.push(bufferValue);
      parts.push(Buffer.from(FormData.LINE_BREAK));
    }
  }
  parts.push(Buffer.from('--' + boundary + '--' + FormData.LINE_BREAK));

  var buffer = form.getBuffer();
  var expected = Buffer.concat(parts);

  assert.equal(buffer.length, expected.length);
  assert.equal(buffer.toString('hex'), expected.toString('hex'));
}());

(function testMatchesStream() {
  var form = new FormData();
  form.append('String', 'Some random string');
  form.append('Int', 42);
  form.append('Buffer', Buffer.from([0x00, 0x01, 0x02]), { filename: 'a.bin', contentType: 'application/x-test' });
  form.append('Empty', '');

  var buffer = form.getBuffer();
  var chunks = [];

  form.on('data', function (chunk) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  form.on('end', function () {
    assert.equal(buffer.toString('hex'), Buffer.concat(chunks).toString('hex'));
  });
  form.resume();
}());
