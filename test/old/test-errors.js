var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var fake = require('fake').create();
var path = require('path');
var fs = require('fs');
var http = require('http');

// https://github.com/felixge/node-form-data/issues/38
(function testAppendArray() {

  var form = new FormData();

  var callback = fake.callback('testAppendArray-onError-append');
  fake.expectAnytime(callback, ['Arrays are not supported.']);

  form.on('error', function(err) {
    // workaround for expectAnytime handling objects
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


  var callback = fake.callback('testGetLengthSync-onError-getLengthSync');
  fake.expectAnytime(callback, ['Cannot calculate proper length in synchronous way.']);

  form.on('error', function(err) {
    // workaroud for expectAnytime handling objects
    callback(err.message);
  });

  var calculatedLength = form.getLengthSync();

  // getLengthSync DOESN'T calculate streams length
  assert.ok(expectedLength > calculatedLength);
})();

(function testStreamError() {
  var req;
  var form = new FormData();
  // make it windows friendly
  var fakePath = path.resolve('/why/u/no/exists');
  var src = fs.createReadStream(fakePath);
  var server = http.createServer();
  var addr = 'http://localhost:' + common.port;

  form.append('fake-stream', src);

  form.on('error', function(err) {
    assert.equal(err.code, 'ENOENT');
    assert.equal(err.path, fakePath);
    req.on('error', function() {});
    server.close();
  });

  server.listen(common.port, function() {
    req = form.submit(addr);
  });
})();
