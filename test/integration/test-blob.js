var common = require('../common');
var assert = common.assert;
var http = require('http');
var FormData = require(common.dir.lib + '/form_data');

(function testBlobAppend() {
  if (typeof Blob === 'undefined') {
    console.log('SKIP: Blob not available');
    return;
  }

  var payload = JSON.stringify({ a: 1, b: 2 });
  var blob = new Blob([payload], { type: 'application/json' });
  var form = new FormData();

  assert.doesNotThrow(function () {
    form.append('data', blob);
  });

  var server = http.createServer(function (req, res) {
    var body = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      assert.ok(body.indexOf('Content-Disposition: form-data; name="data"') !== -1);
      assert.ok(body.indexOf('Content-Type: application/json') !== -1);
      assert.ok(body.indexOf(payload) !== -1);
      res.writeHead(200);
      res.end('OK');
      server.close();
    });
  });

  server.listen(0, function () {
    var url = 'http://localhost:' + server.address().port;
    form.submit(url, function (err, res) {
      if (err) {
        throw err;
      }
      res.resume();
    });
  });
}());
