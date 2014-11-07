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
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var fileName = common.dir.fixture + '/unicycle.jpg';
var myFile = function(){ return fs.createReadStream(fileName); };
var numItems = 5;

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('file', function(name, file) {
      numItems--;
      assert.strictEqual(file.name, path.basename(fileName));
      assert.strictEqual(file.type, mime.lookup(file.name));
    })
    .on('end', function() {
      res.writeHead(200);
      res.end('done');
    });
});

server.listen(common.port, function() {

  var uploadSize = uploaded = 0;

  var r = request.post('http://localhost:' + common.port + '/', function(err, res) {
    assert.strictEqual(res.statusCode, 200);
    server.close();
  });

  var form = r.form();

  for (var i=0; i<numItems; i++) {
    form.append('file_'+i, myFile());
  }

  // get upload size
  form.getLength(function(err, size)
  {
    assert.equal(err, null);
    uploadSize = size;
    assert.ok(uploadSize > 0);
  });

  // calculate uploaded size chunk by chunk
  form.on('data', function(data)
  {
    uploaded += data.length;
  });

  // done uploading compare sizes
  form.on('end', function()
  {
    assert.equal(uploaded, uploadSize);
  });
});

process.on('exit', function() {
  assert.strictEqual(numItems, 0);
});



