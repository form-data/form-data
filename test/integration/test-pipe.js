var common = require('../common');
var assert = common.assert;
var http = require('http');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var FIELDS = [
  {name: 'my_field', value: 'my_value'},
  {name: 'my_buffer', value: new Buffer([1, 2, 3])},
];

var server = http.createServer(function(req, res) {
  var form = new IncomingForm();
  form.parse(req);
  form
    .on('field', function(name, value) {
      var field = FIELDS.shift();
      assert.strictEqual(name, field.name);
      assert.strictEqual(value, field.value+'');
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

  var http = require('http');

  var request = http.request({
    method: 'post',
    port: common.port,
    path: '/upload',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + form.getBoundary(),
    }
  });

  form.pipe(request);
  form.on('data', function(chunk) {
    //process.stderr.write(chunk+'');
  });

  request.on('response', function(res) {
    server.close();
  });
});

