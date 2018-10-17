var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

(function testDeleteWithSingleEntry() {
  var form = new FormData();

  form.append('foo', 'bar');

  form.delete('foo');

  assert.deepEqual(form.getAll('foo'), []);
})();

(function testDeleteWithMultipleEntries() {
  var form = new FormData();

  form.append('foo', 'bar');
  form.append('foo', 'fer');

  form.delete('foo');

  assert.deepEqual(form.getAll('foo'), []);
})();
