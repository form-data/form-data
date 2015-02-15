/*
Test submitting forms with chunked encoding
*/

var common       = require('../common');
var assert       = common.assert;
var http         = require('http');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var remoteRequestOptions = {
  'hostname': 'placehold.it',
  'port': 80,
  'path': '/100x100',
  'method': 'GET'
};

var remoteRequest = http.request(remoteRequestOptions, function(remoteRes) {

  FIELDS = [
    {name: 'remote_chunked_file', value: remoteRes, options: {'filename': 'webServerResponse', 'contentType': 'application/octet-stream'}}
  ];


  server.listen(common.port, function () {
    var form = new FormData();
    var name, options;

    // add test subjects to the form
    FIELDS.forEach(function(field) {
      form.append(field.name, field.value, field.options);
    });

    // TODO: Test setting a custom header for chunked encoding

    form.submit({
      port: common.port,
      path: '/',
      chunked: true
    }, function (err, res) {
      if (err) {
        throw err;
      }

      assert.strictEqual(res.statusCode, 200);

      // unstuck new streams
      res.resume();

      server.close();
    });
  });
});

remoteRequest.on('error', function(err){
  throw err
})

remoteRequest.end()

var server = http.createServer(function(req, res) {
   var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('error', function(error) {
      throw error;
    })
    .on('field', function(name, value) {
      testSubject = testSubjects[name]
      var field = FIELDS.shift();
      assert.strictEqual(name, field.name);
      assert.strictEqual(value, field.value+'');
    })
    .on('file', function(name, file) {
      var field = FIELDS.shift();
      assert.strictEqual(name, field.name);
      // http response doesn't have path property
      assert.strictEqual(file.name, field.options.filename);
      assert.strictEqual(file.type, field.options.contentType);
      // TODO: compare data streamed from original source to result data.
    })
    .on('end', function() {
      res.writeHead(200);
      res.end('done');
    });
});