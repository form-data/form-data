'use strict';

/*
 * `getLength()` has to agree with the number of bytes that are actually
 * serialized when an `fs.ReadStream` only reads a range of a file
 * (a wrong Content-Length means a hung or a truncated request)
 */

var common = require('../common');
var assert = common.assert;
var fs = require('fs');

var FormData = require(common.dir.lib + '/form_data');

var FILE = common.dir.fixture + '/unicycle.jpg';
var FILE_SIZE = fs.statSync(FILE).size;

var testSubjects = [
  { name: 'no range', options: {}, expected: FILE_SIZE },
  { name: 'start only', options: { start: 100 }, expected: FILE_SIZE - 100 },
  { name: 'start and end', options: { start: 100, end: 199 }, expected: 100 },
  { name: 'end only', options: { end: 199 }, expected: 200 },
  { name: 'end only, a single byte', options: { end: 0 }, expected: 1 },
  { name: 'start 0 and end', options: { start: 0, end: 199 }, expected: 200 },
  { name: 'end is the last byte', options: { start: 100, end: FILE_SIZE - 1 }, expected: FILE_SIZE - 100 },
  { name: 'end is Infinity', options: { start: 100, end: Infinity }, expected: FILE_SIZE - 100 },
  { name: 'end only, past the end of the file', options: { end: FILE_SIZE + 5000 }, expected: FILE_SIZE },
  { name: 'start and end, past the end of the file', options: { start: FILE_SIZE - 100, end: FILE_SIZE + 5000 }, expected: 100 },
  { name: 'start 0 and end, past the end of the file', options: { start: 0, end: FILE_SIZE + 5000 }, expected: FILE_SIZE },
  { name: 'start past the end of the file', options: { start: FILE_SIZE + 100 }, expected: 0 },
  { name: 'start and end, both past the end of the file', options: { start: FILE_SIZE + 100, end: FILE_SIZE + 5000 }, expected: 0 }
];

var checked = 0;

/**
 * Appends the stream to a form and compares the length that
 * `getLength()` reports to the size of the serialized body
 *
 * @param {string} name - description of the test subject
 * @param {fs.ReadStream} stream - ranged stream to be appended
 * @param {number} expected - number of file bytes that the stream should provide
 */
function check(name, stream, expected) {
  var form = new FormData();
  form.append('my_file', stream);

  form.getLength(function (err, length) {
    assert.ifError(err);

    var bodyLength = 0;
    form.on('data', function (chunk) {
      bodyLength += chunk.length;
    });

    form.on('end', function () {
      var overhead = form._overheadLength + form._lastBoundary().length;

      assert.strictEqual(bodyLength - overhead, expected, name + ': the stream provided an unexpected number of bytes');
      assert.strictEqual(length, bodyLength, name + ': getLength() does not match the serialized body');
      checked += 1;
    });

    form.resume();
  });
}

testSubjects.forEach(function (subject) {
  check(subject.name, fs.createReadStream(FILE, subject.options), subject.expected);
});

// a stream that was created from an existing file descriptor has no `path`
check('fd without path', fs.createReadStream(null, { fd: fs.openSync(FILE, 'r'), start: 100, end: 199 }), 100);

process.on('exit', function () {
  assert.strictEqual(checked, testSubjects.length + 1);
});
