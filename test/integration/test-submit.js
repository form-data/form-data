var common = require('../common');
var assert = common.assert;
var mime = require('mime-types');
var request = require('request');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');

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

// count total
var fieldsPassed = Object.keys(FIELDS).length;

// prepare form-receiving http server
var server = common.testFields( FIELDS, function(fields){
  fieldsPassed = fields;
});


server.listen(common.port, function() {

  var form = new FormData();

  common.actions.populateFields(form, FIELDS);

  common.actions.submit(form, server);
});

process.on('exit', function() {
  assert.strictEqual(fieldsPassed, 0);
});
