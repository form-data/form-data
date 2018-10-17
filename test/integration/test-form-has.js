var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

(function testWithMissingField() {
  var form = new FormData();

  form.append('foo', 'bar');

  // Make sure our response is async
  assert.strictEqual(form.has('far'), false);
})();

(function testWithFoundField() {
  var form = new FormData();

  form.append('foo', 'bar');

  // Make sure our response is async
  assert.strictEqual(form.has('foo'), true);
})();

(function testWithMultipleValues() {
  var form = new FormData();

  form.append('foo', 'bar');
  form.append('foo', 'baz');
  form.append('foo', 'bad');

  // Make sure our response is async
  assert.strictEqual(form.has('foo'), true);
})();
