'use strict';

/*
 * test RFC 5987 encoding of filename* in Content-Disposition header:
 * re: https://github.com/form-data/form-data/issues/572
 *
 * Parentheses and other RFC 2616 separators must be percent-encoded
 * in filename* values per RFC 5987, Section 3.2.
 */

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testParenthesesEncoded() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'test(1).txt' });

  var buffer = form.getBuffer().toString();

  assert.ok(
    buffer.indexOf('filename="test(1).txt"') !== -1,
    'Expects unencoded filename parameter for backward compatibility'
  );
  assert.ok(
    buffer.indexOf("filename*=utf-8''test%281%29.txt") !== -1,
    'Expects RFC 5987 encoded filename* with percent-encoded parentheses'
  );
}());

(function testNoFilenameStarForSimpleFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'test.txt' });

  var buffer = form.getBuffer().toString();

  assert.ok(
    buffer.indexOf('filename="test.txt"') !== -1,
    'Expects unencoded filename parameter'
  );
  assert.ok(
    buffer.indexOf('filename*') === -1,
    'Expects no filename* for filenames with only attr-char characters'
  );
}());

(function testSpaceEncoded() {
  var form = new FormData();
  form.append('file', Buffer.from('test'), { filename: 'my file.txt' });

  var buffer = form.getBuffer().toString();

  assert.ok(
    buffer.indexOf('filename="my file.txt"') !== -1,
    'Expects unencoded filename parameter'
  );
  assert.ok(
    buffer.indexOf("filename*=utf-8''my%20file.txt") !== -1,
    'Expects RFC 5987 encoded filename* with percent-encoded space'
  );
}());
