var common = require('../common');
var assert = common.assert;
var http = require('http');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var times = 10;

var server = http.createServer(function(req, res) {

  // no need to have tmp dir here, since no files being uploaded
  // but formidable would fail in 0.6 otherwise
  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('field', common.actions.basicFormOnField)
    .on('end', function() {
      res.writeHead(200);
      res.end('done');

      times--;

      if (times == 0) {
        server.close();
      }
    });
});

server.listen(common.port, function() {
  var i;

  for (i = 0; i < times; i++) {
    var form = new FormData();

    form.append('my_field', 'my_value');

    form.submit('http://localhost:' + common.port + '/');
  }

});

process.on('exit', function() {
  assert.strictEqual(times, 0);
});
