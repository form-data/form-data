var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var fake = require('fake').create();
var fs = require('fs');

// https://github.com/felixge/node-form-data/issues/38
(function testAppendArray() {

  var form = new FormData();

  var callback = fake.callback(arguments.callee.name + '-onError-append');
  fake.expectAnytime(callback, ['Arrays are not supported.']);

  form.on('error', function(err) {
    // workaroud for expectAnytime handling objects
    callback(err.message);
  });

  form.append('my_array', ['bird', 'cute']);
})();


(function testGetLengthSync() {
  var fields = [
    {
      name: 'my_string',
      value: 'Test 123'
    },
    {
      name: 'my_image',
      value: fs.createReadStream(common.dir.fixture + '/unicycle.jpg')
    }
  ];

  var form = new FormData();
  var expectedLength = 0;

  fields.forEach(function(field) {
    form.append(field.name, field.value);
    if (field.value.path) {
      var stat = fs.statSync(field.value.path);
      expectedLength += stat.size;
    } else {
      expectedLength += field.value.length;
    }
  });
  expectedLength += form._overheadLength + form._lastBoundary().length;


  var callback = fake.callback(arguments.callee.name + '-onError-getLengthSync');
  fake.expectAnytime(callback, ['Cannot calculate proper length in synchronous way.']);

  form.on('error', function(err) {
    // workaroud for expectAnytime handling objects
    callback(err.message);
  });

  var calculatedLength = form.getLengthSync();

  // getLengthSync DOESN'T calculate streams length
  assert.ok(expectedLength > calculatedLength);
})();
