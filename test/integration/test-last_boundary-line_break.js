var http = require('http');
var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var server;

function submitForm() {

  var form = new FormData();

  form.append('field', 'value');

  form.submit('http://localhost:' + common.port + '/', function(err, res) {

    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();
  });
}

// create https server
server = http.createServer(function(req, res) {

  var body = '';

  req.setEncoding('utf8');

  // old and simple
  req.on('data', function(data) {
    body += data;
  });

  req.on('end', function() {
    // last character(s) sequence equals predefined line break
    assert.strictEqual(body.substr(-1 * FormData.LINE_BREAK.length), FormData.LINE_BREAK);

    res.writeHead(200);
    res.end();
  });
});

// when https server ready submit form
server.listen(common.port, submitForm);
