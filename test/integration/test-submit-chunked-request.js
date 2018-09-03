var common = require('../common');
var assert = common.assert;
var mime = require('mime-types');
var request = require('request');
var FormData = require(common.dir.lib + '/form_data');

var remoteFile = 'http://localhost:' + common.staticPort + '/unicycle.jpg';

// wrap non simple values into function
// just to deal with ReadStream "autostart"
var FIELDS = {
  'remote_file': {
    type: mime.lookup(common.dir.fixture + '/unicycle.jpg'),
    value: function() {
      return request(remoteFile)
        .on('response', function(response) {
          // Remove content-length header from response, force it to be chunked
          delete response.headers['content-length'];
        });
    }
  }
};

// count total
var fieldsPassed = Object.keys(FIELDS).length;

// prepare form-receiving http server
var server = common.testFields(FIELDS, function(fields){
  fieldsPassed = fields;
});

server.listen(common.port, function() {

  var form = new FormData();

  common.actions.populateFields(form, FIELDS);

  // custom params object passed to submit
  form.submit({
    port: common.port,
    path: '/'
  }, function(err, res) {

    if (err) {
      throw err;
    }

    // Only now we know that it's a chunked stream, as form.submit() called getLength()

    assert.strictEqual(form.getHeaders()['transfer-encoding'], 'chunked');
    assert.strictEqual(form.isChunked(), true);

    // Verify status code
    assert.strictEqual(res.statusCode, 200);

    // Try to get length again - that should take an already cached value and cover the _calculatedLength code branch
    form.getLength(function (ex, length) {
      assert.ok(isNaN(length));
    });

    res.resume();
    server.close();
  });

});

process.on('exit', function() {
  assert.strictEqual(fieldsPassed, 0);
});
