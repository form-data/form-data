/*
test custom headers object.
https://github.com/form-data/form-data/issues/133
*/

var common = require('../common');
var assert = common.assert;
var http = require('http');

var FormData = require(common.dir.lib + '/form_data');

var testHeader = { 'X-Test-Fake': 123 };

var expectedLength;


var server = http.createServer(function(req, res) {
  assert.ok( typeof req.headers['content-length'] !== 'undefined' );
  assert.equal(req.headers['content-length'], expectedLength);

  req.on('data', function (data) {
    assert.equal(
      data.toString('utf8').split('\n')[3],
      'X-Test-Fake: 123\r'
    );
  });

  res.writeHead(200);
  res.end('done');
});


server.listen(common.port, function() {
  var form = new FormData();

  var options = {
    header: testHeader,

    // override content-length,
    // much lower than actual buffer size (1000)
    knownLength: 1
  };

  var bufferData = [];
  for (var z = 0; z < 1000; z++) {
    bufferData.push(1);
  }
  var buffer = new Buffer(bufferData);

  form.append('my_buffer', buffer, options);

  // (available to req handler)
  expectedLength = form._lastBoundary().length + form._overheadLength + options.knownLength;

  common.actions.submit(form, server);
});
