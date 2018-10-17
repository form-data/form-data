var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

(function testSetWithoutFoundEntries() {
  var form = new FormData();

  form.set('foo', 'bar');

  assert.deepEqual(form.getAll('foo'), ['bar']);
})();

(function testSetByReplacingCurrentEntry() {
  var form = new FormData();

  form.append('first_name', 'hello');
  form.append('last_name', 'world');

  form.set('last_name', ',world');

  assert.deepEqual(form.getAll('last_name'), [',world']);
})();

(function testSetByReplacingCurrentEntry() {
  var form = new FormData();

  form.append('first_name', 'hello');
  form.append('last_name', 'world');
  form.append('last_name', ',me too');

  assert.deepEqual(form.getAll('last_name'), ['world', ',me too']);

  form.set('last_name', ',world');

  assert.deepEqual(form.getAll('last_name'), [',world']);
  assert.deepEqual(form.getAll('first_name'), ['hello']);
})();
