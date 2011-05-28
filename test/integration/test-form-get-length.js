var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var fake = require('fake').create();

(function testEmptyForm() {
  var form = new FormData();
  var callback = fake.callback(arguments.callee.name + '-getLength');
  var calls = fake.expect(callback, [null, 0]).calls;

  form.getLength(callback);

  // Make sure our response is async
  assert.strictEqual(calls.length, 0);
})();

(function testUtf8String() {
  var FIELD = 'my_field';
  var VALUE = 'May the € be with you';

  var form = new FormData();
  form.append(FIELD, VALUE);
  var callback = fake.callback(arguments.callee.name + '-getLength');

  var expectedLength =
    form._overheadLength +
    Buffer.byteLength(VALUE) +
    form._lastBoundary().length;

  fake.expect(callback, [null, expectedLength]);
  form.getLength(callback);
})();

(function testBuffer() {
  var FIELD = 'my_field';
  var VALUE = new Buffer(23);

  var form = new FormData();
  form.append(FIELD, VALUE);
  var callback = fake.callback(arguments.callee.name + '-getLength');

  var expectedLength =
    form._overheadLength +
    VALUE.length +
    form._lastBoundary().length;

  fake.expect(callback, [null, expectedLength]);
  form.getLength(callback);
})();


