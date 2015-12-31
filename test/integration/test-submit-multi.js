var common = require('../common');
var assert = common.assert;
var http = require('http');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;
var times = 10;
var server;

/**
 * Test parallel submissions to the same server
 */
function submitForm() {
  var form = new FormData();

  form.append('my_field', 'my_value');

  form.submit('http://localhost:' + common.port + '/', function(err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // Needed for node-0.10.x because Streams2
    // more info: http://nodejs.org/api/stream.html#stream_compatibility_with_older_node_versions
    res.resume();

    times--;
    if (times == 0) {
      server.close();
    }
  });
}

server = http.createServer(function(req, res) {

  // no need to have tmp dir here, since no files being uploaded
  // but formidable would fail in 0.6 otherwise
  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('field', common.actions.basicFormOnField)
    .on('end', common.actions.formOnEnd.bind(null, res));
});

server.listen(common.port, function() {
  var i;

  for (i = 0; i < times; i++) {
    submitForm();
  }
});

process.on('exit', function() {
  assert.strictEqual(times, 0);
});
