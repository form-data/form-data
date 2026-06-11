'use strict';

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testFieldNameCRLFInjection() {
  var form = new FormData();
  form.append('email"\r\nX-Injected: true\r\nfake="', 'user@example.com');

  var output = form.getBuffer().toString();

  assert.equal(output.indexOf('X-Injected: true\r\n'), -1, 'CRLF in a field name must not produce an injected header line');
  assert.notEqual(output.indexOf('%0D%0A'), -1, 'CR/LF in a field name must be escaped');
  assert.notEqual(output.indexOf('%22'), -1, 'a `"` in a field name must be escaped');
}());

(function testFilenameCRLFInjection() {
  var form = new FormData();
  form.append('file', Buffer.from('x'), { filename: 'a"\r\nX-Injected: yes\r\nb"' });

  var output = form.getBuffer().toString();

  assert.equal(output.indexOf('X-Injected: yes\r\n'), -1, 'CRLF in a filename must not produce an injected header line');
  assert.notEqual(output.indexOf('filename="a%22%0D%0A'), -1, 'CR/LF/`"` in a filename must be escaped');
}());

(function testFieldNameBoundarySmuggling() {
  var form = new FormData();
  var boundary = form.getBoundary();

  form.append('username"\r\n\r\nlegit_user\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="is_admin"\r\n\r\ntrue\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="fake', 'ignored_value');

  var output = form.getBuffer().toString();
  var headerLines = output.split('\r\n').filter(function (line) {
    return line.indexOf('Content-Disposition') === 0;
  });

  assert.equal(output.indexOf('name="is_admin"'), -1, 'a CRLF-laden field name must not smuggle an extra part');
  assert.equal(headerLines.length, 1, 'the whole field name must stay on one header line, smuggling no extra parts');
}());

(function testOrdinaryFieldNamePreserved() {
  var form = new FormData();
  form.append('items[0]', 'value');

  var output = form.getBuffer().toString();

  assert.notEqual(output.indexOf('name="items[0]"'), -1, 'a field name without control characters must be unchanged');
}());
