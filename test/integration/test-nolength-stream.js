/*
Test streams without a discernable length.
*/

var common       = require('../common');
var assert       = common.assert;
var http         = require('http');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var testRequestOptions = {
  'hostname': 'placehold.it',
  'port': 80,
  'path': '/100x100',
  'method': 'GET'
};

var testRequest = http.request(testRequestOptions, function(testResponse) {

  var testSubjects = {
    'a_stream': {
      'stream': testResponse,
      'options': {
        'filename': 'webServerResponse',
        'contentType': 'application/octet-stream'
      }
    }
  };

  server.listen(common.port, function () {
    var form = new FormData({'chunked': true});
    var name, options;

    // add test subjects to the form
    for (name in testSubjects) {
      if (!testSubjects.hasOwnProperty(name)) continue;
      form.append(name, testSubjects[name].stream, testSubjects[name].options);
    }

    form.submit('http://localhost:' + common.port + '/', function (err, res) {
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

testRequest.on('error', function(err){
  throw err
})

testRequest.end()

var server = http.createServer(function(req, res) {
  var requestBodyLength = 0;

  req.on('data', function(data) {
    requestBodyLength += data.length;
  });

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('error', function(error) {
      throw error;
    })
    .on('field', function(name, value) {
      console.log("FIELD", name, value);
    })
    .on('file', function(name, file) {
      assert.strictEqual(name, field.name);
      // http response doesn't have path property
      assert.strictEqual(file.name, path.basename(field.value.path || remoteFile));
      assert.strictEqual(file.type, mime.lookup(file.name));
    })
    .on('end', function() {
      console.log("END")
      res.writeHead(200);
      res.end('done');
      throw new Error("ERROR")
    });
});