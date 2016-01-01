var common = require('../common');
var assert = common.assert;
var http = require('http');
var parseUrl = require('url').parse;
var FormData = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

// static server prepared for all tests
var remoteFile = 'http://localhost:' + common.staticPort + '/unicycle.jpg';

var server;

var parsedUrl = parseUrl(remoteFile);
var options = {
  method: 'get',
  port: parsedUrl.port || 80,
  path: parsedUrl.pathname,
  host: parsedUrl.hostname
};

var FIELDS = {
  'my_field': {
    value: 'my_value'
  },
  'my_buffer': {
    type: FormData.DEFAULT_CONTENT_TYPE,
    value: common.defaultTypeValue
  },
  'remote_file': {
    value: 'TBD',
    name: remoteFile
  }
};
// count total
var fieldsPassed = Object.keys(FIELDS).length;

// request static file
http.request(options, function(response) {

  var form = new FormData();

  // add http response to the form fields
  FIELDS['remote_file'].value = response;

  common.actions.populateFields(form, FIELDS);

  server.listen(common.port, function() {
    common.actions.submit(form, server);
  });

}).end();

// prepare form-receiving http server
server = http.createServer(function(req, res) {

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


process.on('exit', function() {
  assert.strictEqual(fieldsPassed, 0);
});
