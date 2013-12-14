/*
test custom filename and content-type of Buffer objects
re: https://github.com/felixge/node-form-data/issues/54
*/

var common       = require('../common');
var assert       = common.assert;
var http         = require('http');
var fs           = require('fs');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var options = {
  filename: 'buffer.bin',
  contentType: 'application/custom-type'
};

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  form
    .on('file', function(name, file) {
      if (name == 'buffer_two') {
	assert.strictEqual(file.name, 'buffer_two.bin');
	assert.strictEqual(file.type, 'application/octet-stream');

      } else if (name == 'buffer_three') {
	assert.strictEqual(file.name, 'buffer_three.bin');
	assert.strictEqual(file.type, 'application/custom-type');
      } else {
	throw new Error('Error: Unexpected file received.');
      }
    })
    .on('field', function(name, value) {
      // Verify integrity of data sent.
      if (name == 'buffer_one') {
	assert.strictEqual(value, 'ABCD');
      }
    })
    .on('end', function() {
      res.writeHead(200);
      res.end('done');
    });
});


server.listen(common.port, function() {
  var form = new FormData();
  // A buffer with the string 'ABCD' enconded with ASCII decimal values.
  var buffer = new Buffer([65, 66, 67, 68]);

  // Test for the default content type
  form.append('buffer_one', buffer);
  // Test for the usage of custom filename.
  form.append('buffer_two' , buffer, 
	      {filename: 'buffer_two.bin'});
  // Test for the correct usage of custom content-type.
  form.append('buffer_three' , buffer, 
	      {filename: 'buffer_three.bin', contentType: 'application/custom-type'});

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
