var common = require('../common');
var assert = common.assert;
var http = require('http');
var mime = require('mime-types');
var request = require('request');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var remoteFile = 'http://localhost:' + common.staticPort + '/unicycle.jpg';

// wrap non simple values into function
// just to deal with ReadStream "autostart"
var FIELDS = {
  'my_field': {
    value: 'my_value'
  },
  'my_buffer': {
    type: FormData.DEFAULT_CONTENT_TYPE,
    value: common.defaultTypeValue
  },
  'my_file': {
    type: mime.lookup(common.dir.fixture + '/unicycle.jpg'),
    value: function() { return fs.createReadStream(common.dir.fixture + '/unicycle.jpg'); }
  },
  'remote_file': {
    type: mime.lookup(common.dir.fixture + '/unicycle.jpg'),
    value: function() { return request(remoteFile); }
  }
};
var fieldsPassed = Object.keys(FIELDS).length;

var server = http.createServer(function(req, res) {
  assert.ok(req.headers['x-test-header'], 'test-header-value');

  var form = new IncomingForm({uploadDir: common.dir.tmp});

  form.parse(req);

  common.actions.checkForm(form, FIELDS, function(fieldsChecked)
  {
    // keep track of number of the processed fields
    fieldsPassed = fieldsPassed - fieldsChecked;
    // finish it
    common.actions.formOnEnd(res);
  });
});

server.listen(common.port, function() {

  var form = new FormData();

  common.actions.populateFields(form, FIELDS);

  // custom params object passed to submit
  form.submit({
    port: common.port,
    path: '/',
    headers: {
      'x-test-header': 'test-header-value'
    }
  }, function(error, result) {
    if (error) {
      throw error;
    }

    assert.strictEqual(result.statusCode, 200);

    // unstuck streams
    result.resume();
    server.close();
  });

});

process.on('exit', function() {
  assert.strictEqual(fieldsPassed, 0);
});
