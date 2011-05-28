var common = require('../common');
var assert = common.assert;
var http = require('http');
var path = require('path');
var mime = require('mime');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var FIELDS = [
  {name: 'my_field', value: 'my_value'},
  {name: 'my_buffer', value: new Buffer([1, 2, 3])},
  {name: 'my_file', value: fs.createReadStream(common.dir.fixture + '/unicycle.jpg')},
];

var server = http.createServer(function(req, res) {
  var form = new IncomingForm();
  form.uploadDir = common.dir.tmp;
  form.parse(req);
  form
    .on('field', function(name, value) {
      var field = FIELDS.shift();
      assert.strictEqual(name, field.name);
      assert.strictEqual(value, field.value+'');
    })
    .on('file', function(name, file) {
      var field = FIELDS.shift();
      assert.strictEqual(name, field.name);
      assert.strictEqual(file.name, path.basename(field.value.path));
      assert.strictEqual(file.type, mime.lookup(file.name));
    })
    .on('end', function() {
      res.writeHead(200);
      res.end('done');
    });
});

server.listen(common.port, function() {
  var form = new FormData();
  FIELDS.forEach(function(field) {
    form.append(field.name, field.value);
  });

  form.submit('http://localhost:' + common.port + '/', function(err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);
    server.close();
  });
});

process.on('exit', function() {
  assert.strictEqual(FIELDS.length, 0);
});
