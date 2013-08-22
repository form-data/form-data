var common = require('../common');
var assert = common.assert;
var http = require('http');
var path = require('path');
var mime = require('mime');
var request = require('request');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var remoteFile = 'http://nodejs.org/images/logo.png';

// wrap non simple values into function
// just to deal with ReadStream "autostart"
// Can't wait for 0.10
var FIELDS = {
  'my_field': 'my_value',
  'my_buffer': function(){ return new Buffer([1, 2, 3]); },
  'my_file': function(){ return fs.createReadStream(common.dir.fixture + '/unicycle.jpg'); },
  'remote_file': function(){ return request(remoteFile); }
};
var posts = 10;
var postsRemaining = posts;
var fieldsPassed = 4*posts;

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('field', function(name, value) {
      fieldsPassed--;
      var field = FIELDS[name];
      assert.ok(field);
      assert.strictEqual(value, ''+field);
    })
    .on('file', function(name, file) {
      fieldsPassed--;
      var field = FIELDS[name];
      assert.ok(field);
      assert.strictEqual(file.name, path.basename(field.path));
      assert.strictEqual(file.type, mime.lookup(file.name));
    })
    .on('end', function() {
      res.writeHead(200);
      res.end('done');
    });
});

server.listen(common.port, function() {

  for (var i =0; i < posts; i++)
  {
    (function() {

      var form = new FormData();

      for (var name in FIELDS) {
        if (!FIELDS.hasOwnProperty(name)) continue;

        // important to append ReadStreams within the same tick
        if ((typeof FIELDS[name] == 'function')) {
          FIELDS[name] = FIELDS[name]();
        }

        form.append(name, FIELDS[name]);
      }

      form.submit('http://localhost:' + common.port + '/', function(err, res) {

        if (err) {
          throw err;
        }

        assert.strictEqual(res.statusCode, 200);

        postsRemaining--;
        if (postsRemaining == 0) server.close();
      });
    })();
  }

});

process.on('exit', function() {
  assert.strictEqual(fieldsPassed, 0);
});
