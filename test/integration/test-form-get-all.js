var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

(function testEmptyForm() {
  var form = new FormData();

  // Make sure our response is async
  assert.strictEqual(form.get('foo'), null);
  assert.deepEqual(form.getAll('foo'), []);
})();

(function testWithOneValue() {
  var form = new FormData();

  form.append('foo', 'bar');

  // Make sure our response is async
  assert.strictEqual(form.get('foo'), 'bar');
  assert.deepEqual(form.getAll('foo'), ['bar']);
})();

(function testWithMultipleValue() {
  var form = new FormData();

  form.append('foo', 'bar');
  form.append('foo', 'baz');
  form.append('foo', 'bad');

  // Make sure our response is async
  assert.strictEqual(form.get('foo'), 'bar');
  assert.deepEqual(form.getAll('foo'), ['bar', 'baz', 'bad']);
})();
