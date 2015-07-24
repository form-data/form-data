/*
test custom filename and content-type:
re: https://github.com/felixge/node-form-data/issues/29
*/

var common       = require('../common');
var assert       = common.assert;
var mime         = require('mime-types');
var http         = require('http');
var fs           = require('fs');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var options = {
  filename: 'test.png',
  contentType: 'image/gif'
};

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req, function (err, fields, files) {
      assert(!err);
    
      assert('my_file1' in files);
      assert.strictEqual(files['my_file1'].name, options.filename);
      assert.strictEqual(files['my_file1'].type, options.contentType);

      assert('my_file2' in files);
      assert.strictEqual(files['my_file2'].name, options.filename);
      assert.strictEqual(files['my_file2'].type, mime.lookup(options.filename));

      assert('my_file3' in files);
      assert.strictEqual(files['my_file3'].type, FormData.DEFAULT_CONTENT_TYPE);

      res.writeHead(200);
      res.end('done');
  });
});


server.listen(common.port, function() {
  var form = new FormData();

  // Explicit contentType and filename.
  form.append('my_file1', fs.createReadStream(common.dir.fixture + '/unicycle.jpg'), options);
  // Filename only.
  form.append('my_file2', fs.createReadStream(common.dir.fixture + '/unicycle.jpg'), options.filename);
  // No options or implicit file type from extension.
  form.append('my_file3', fs.createReadStream(common.dir.fixture + '/unknown_file_type'));

  form.submit('http://localhost:' + common.port + '/', function(err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();
  });

});
