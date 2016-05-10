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

var knownFile = common.dir.fixture + '/unicycle.jpg';
var unknownFile = common.dir.fixture + '/unknown_file_type';

var options = {
  filename: 'test.png',
  contentType: 'image/gif'
};

var optionsWithPath = {
  filename: 'subdir/test.png',
};

var server = http.createServer(function(req, res) {

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req, function (err, fields, files) {
    assert(!err);

    assert('custom_everything' in files);
    assert.strictEqual(files['custom_everything'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['custom_everything'].type, options.contentType, 'Expects custom content-type');

    assert('custom_filename' in files);
    assert.strictEqual(files['custom_filename'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['custom_filename'].type, mime.lookup(knownFile), 'Expects original content-type');

    assert('unknown_with_filename' in files);
    assert.strictEqual(files['unknown_with_filename'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['unknown_with_filename'].type, mime.lookup(options.filename), 'Expects filename-derived content-type');

    assert('unknown_with_filename_as_object' in files);
    assert.strictEqual(files['unknown_with_filename_as_object'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['unknown_with_filename_as_object'].type, mime.lookup(options.filename), 'Expects filename-derived content-type');

    assert('relative_path' in files);
    assert.strictEqual(files['relative_path'].name, optionsWithPath.filename, 'Expects filename with relative path');

    assert('unknown_everything' in files);
    assert.strictEqual(files['unknown_everything'].type, FormData.DEFAULT_CONTENT_TYPE, 'Expects default content-type');

    res.writeHead(200);
    res.end('done');
  });
});


server.listen(common.port, function() {
  var form = new FormData();

  // Explicit contentType and filename.
  form.append('custom_everything', fs.createReadStream(knownFile), options);
  // Filename only with real file
  form.append('custom_filename', fs.createReadStream(knownFile), options.filename);
  // Filename only with unknown file
  form.append('unknown_with_filename', fs.createReadStream(unknownFile), options.filename);
  // Filename only with unknown file
  form.append('unknown_with_filename_as_object', fs.createReadStream(unknownFile), {filename: options.filename});
  // Filename with a relative path
  form.append('relative_path', fs.createReadStream(unknownFile), {filename: optionsWithPath.filename, includePath: true});
  // No options or implicit file type from extension.
  form.append('unknown_everything', fs.createReadStream(unknownFile));

  common.actions.submit(form, server);
});
