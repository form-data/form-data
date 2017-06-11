/*
test custom filename and content-type:
re: https://github.com/felixge/node-form-data/issues/29
*/

var common       = require('../common');
var assert       = common.assert;
var mime         = require('mime-types');
var http         = require('http');
var fs           = require('fs');
var path         = require('path');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var knownFile = path.join(common.dir.fixture, 'unicycle.jpg');
var unknownFile = path.join(common.dir.fixture, 'unknown_file_type');
var relativeFile = path.relative(path.join(knownFile, '..', '..'), knownFile);

var options = {
  filename: 'test.png',
  contentType: 'image/gif'
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

    assert('custom_filepath' in files);
    assert.strictEqual(files['custom_filepath'].name, relativeFile.replace(/\\/g, '/'), 'Expects custom filepath');
    assert.strictEqual(files['custom_filepath'].type, mime.lookup(knownFile), 'Expects original content-type');

    assert('unknown_with_filename' in files);
    assert.strictEqual(files['unknown_with_filename'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['unknown_with_filename'].type, mime.lookup(options.filename), 'Expects filename-derived content-type');

    assert('unknown_with_filename_as_object' in files);
    assert.strictEqual(files['unknown_with_filename_as_object'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['unknown_with_filename_as_object'].type, mime.lookup(options.filename), 'Expects filename-derived content-type');

    assert('unknown_with_name_prop' in files);
    assert.strictEqual(files['unknown_with_name_prop'].name, options.filename, 'Expects custom filename');
    assert.strictEqual(files['unknown_with_name_prop'].type, mime.lookup(options.filename), 'Expects filename-derived content-type');

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
  // Filename with relative path
  form.append('custom_filepath', fs.createReadStream(knownFile), {filepath: relativeFile});
  // No options or implicit file type from extension on name property.
  var customNameStream = fs.createReadStream(unknownFile);
  customNameStream.name = options.filename;
  form.append('unknown_with_name_prop', customNameStream);
  // No options or implicit file type from extension.
  form.append('unknown_everything', fs.createReadStream(unknownFile));

  common.actions.submit(form, server);
});
