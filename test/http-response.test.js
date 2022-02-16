var common = require('./common');
var http = require('http');
var parseUrl = require('url').parse;
var FormData = require(common.dir.lib + '/form_data');
const staticServer = require('./static');
var assert = common.assert;

let httpServer;
beforeEach(async () => {
  httpServer = await staticServer();
})

afterEach(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
})

it('http-response', (done) => {
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

  // request static file
  http.request(options, function(response) {

    var form = new FormData();

    // add http response to the form fields
    FIELDS['remote_file'].value = response;

    common.actions.populateFields(form, FIELDS);

    server.listen(common.port, function() {
      common.actions.submit(form, server, () => {
        assert.strictEqual(fieldsPassed, 0);
        done();
      });
    });

  }).end();

  // count total
  var fieldsPassed = Object.keys(FIELDS).length;

  // prepare form-receiving http server
  server = common.testFields(FIELDS, function(fields){
    fieldsPassed = fields;
  });

});
