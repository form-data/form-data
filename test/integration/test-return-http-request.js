/*
test return http request, added for issue #47:
https://github.com/felixge/node-form-data/issues/47

Checking correct length header and request object
*/

var common = require('../common');
var assert = common.assert;
var http = require('http');

var FormData = require(common.dir.lib + '/form_data');

var CRLF = '\r\n';

var expectedLength;

var dataSize = 1000000;

var server = http.createServer(function(req, res) {
  var data = '', uploaded = 0;

  assert.ok( typeof req.headers['content-length'] !== 'undefined' );
  assert.equal(req.headers['content-length'], expectedLength);

  // check for uploaded body
  req.on('data', function(data) {
    uploaded += data.length;
  });
  req.on('end', function()
  {
    // compare uploaded total to the expected length
    assert.equal(uploaded, expectedLength);

    res.writeHead(200);
    res.end('done');
  });

});


server.listen(common.port, function() {
  var R, oWrite, progress = 0, form = new FormData();

  var bufferData = [];
  for (var z = 0; z < dataSize; z++) {
    bufferData.push(1);
  }
  var buffer = new Buffer(bufferData);

  form.append('my_buffer', buffer);

  // (available to req handler)
  expectedLength = form._lastBoundary().length + form._overheadLength + dataSize;

  R = form.submit('http://localhost:' + common.port + '/', function(err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();

    // compare progress total to the expected length
    assert.equal(progress, expectedLength);
  });

  // augment into request
  oWrite = R.write;
  R.write = function(chunk) {
    return oWrite.call(this, chunk, function() {
      form.emit('progress', chunk);
    });
  };

  // track progres
  form.on('progress', function(chunk) {
    progress += chunk.length;
    assert.ok(progress <= expectedLength);
  });

});
