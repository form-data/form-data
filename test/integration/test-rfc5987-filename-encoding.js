'use strict';

/*
 * test RFC 5987 filename* encoding in Content-Disposition:
 * re: https://github.com/form-data/form-data/issues/572
 *
 * Parentheses are RFC 2616 separators, not tokens. Per RFC 5987 Section 3.2,
 * they are not in the attr-char set and must be percent-encoded in filename*.
 */

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testParenthesesInFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'file(1).txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename="file(1).txt"') !== -1,
    'Should have simple filename parameter'
  );
  assert.ok(
    header.indexOf("filename*=UTF-8''file%281%29.txt") !== -1,
    'Should have RFC 5987 encoded filename* with parentheses percent-encoded'
  );
}());

(function testSpaceInFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'my file.txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename="my file.txt"') !== -1,
    'Should have simple filename parameter with space'
  );
  assert.ok(
    header.indexOf("filename*=UTF-8''my%20file.txt") !== -1,
    'Should have RFC 5987 encoded filename* with space percent-encoded'
  );
}());

(function testNonAsciiFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'café.txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename="café.txt"') !== -1,
    'Should have simple filename parameter with non-ASCII'
  );
  assert.ok(
    header.indexOf("filename*=UTF-8''caf%C3%A9.txt") !== -1,
    'Should have RFC 5987 encoded filename* with UTF-8 percent-encoding'
  );
}());

(function testSimpleAsciiFilename() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'test.txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename="test.txt"') !== -1,
    'Should have simple filename parameter'
  );
  assert.ok(
    header.indexOf('filename*=') === -1,
    'Should NOT have filename* when filename is pure attr-char'
  );
}());

(function testMultipleSpecialChars() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'report [final] (v2).txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf("filename*=UTF-8''") !== -1,
    'Should have filename* for brackets, spaces, and parentheses'
  );
  assert.ok(
    header.indexOf('%28') !== -1,
    'Parenthesis ( should be percent-encoded'
  );
  assert.ok(
    header.indexOf('%29') !== -1,
    'Parenthesis ) should be percent-encoded'
  );
  assert.ok(
    header.indexOf('%5B') !== -1,
    'Bracket [ should be percent-encoded'
  );
  assert.ok(
    header.indexOf('%5D') !== -1,
    'Bracket ] should be percent-encoded'
  );
}());

(function testFilepathWithSpecialChars() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filepath: 'uploads/file (copy).txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename="uploads/file (copy).txt"') !== -1,
    'Should have simple filename parameter with filepath'
  );
  assert.ok(
    header.indexOf("filename*=UTF-8''uploads%2Ffile%20%28copy%29.txt") !== -1,
    'Should have RFC 5987 encoded filename* with filepath special chars encoded'
  );
}());

(function testAttrCharNotEncoded() {
  var form = new FormData();
  form.append('file', Buffer.from('content'), { filename: 'a!#$&+-.^_`|~z.txt' });

  var header = form.getBuffer().toString();

  assert.ok(
    header.indexOf('filename*=') === -1,
    'Should NOT have filename* when filename only contains attr-char characters'
  );
}());
