/**
 * Show & Test for `mikeal/request` library
 * as bonus shows progress monitor implementation
 */
var common = require('../common');
var assert = common.assert;
var http = require('http');
var path = require('path');
var mime = require('mime-types');
var request = require('request');
var FormData = require(common.dir.lib + '/form_data');
var fs = require('fs');
var IncomingForm = require('formidable').IncomingForm;

var fileName = common.dir.fixture + '/unicycle.jpg';
var myFile = function() { return fs.createReadStream(fileName); };
var numItems = 5;

// Make request to use our FormData
request.prototype.form = function (form) {
  var self = this;
  if (form) {
    if (!/^application\/x-www-form-urlencoded\b/.test(self.getHeader('content-type'))) {
      self.setHeader('content-type', 'application/x-www-form-urlencoded');
    }
    self.body = (typeof form === 'string')
      ? self._qs.rfc3986(form.toString('utf8'))
      : self._qs.stringify(form).toString('utf8');
    return self;
  }
  // create form-data object
  self._form = new FormData();
  self._form.on('error', function(err) {
    err.message = 'form-data: ' + err.message;
    self.emit('error', err);
    self.abort();
  });
  return self._form;
};

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('file', function(name, file) {
      numItems--;
      assert.strictEqual(file.name, path.basename(fileName));
      assert.strictEqual(file.type, mime.lookup(file.name));
    })
    .on('end', common.actions.formOnEnd.bind(null, res));
});

server.listen(common.port, function() {

  var uploadSize = 0;
  var uploaded = 0;

  var r = request.post('http://localhost:' + common.port + '/', function(err, res) {
    assert.ifError(err);
    assert.strictEqual(res.statusCode, 200);
    server.close();
  });

  var form = r.form();

  for (var i = 0; i < numItems; i++) {
    form.append('file_' + i, myFile());
  }

  // get upload size
  form.getLength(function(err, size) {
    assert.equal(err, null);
    uploadSize = size;
    assert.ok(uploadSize > 0);
  });

  // calculate uploaded size chunk by chunk
  form.on('data', function(data) {
    uploaded += data.length;
  });

  // done uploading compare sizes
  form.on('end', function() {
    assert.equal(uploaded, uploadSize);
  });
});

process.on('exit', function() {
  assert.strictEqual(numItems, 0);
});
