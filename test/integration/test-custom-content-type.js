var common = require('../common');
var assert = common.assert;
var http = require('http');
var mime = require('mime-types');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');

// wrap non simple values into function
// just to deal with ReadStream "autostart"
var FIELDS = {
  'no_type': {
    value: 'my_value'
  },
  'custom_type': {
    value: 'my_value',
    expectedType: 'image/png',
    options: {
      contentType: 'image/png'
    }
  },
  'default_type': {
    expectedType: FormData.DEFAULT_CONTENT_TYPE,
    value: common.defaultTypeValue
  },
  'implicit_type': {
    expectedType: mime.lookup(common.dir.fixture + '/unicycle.jpg'),
    value: function() { return fs.createReadStream(common.dir.fixture + '/unicycle.jpg'); }
  },
  'overridden_type': {
    expectedType: 'image/png',
    options: {
      contentType: 'image/png'
    },
    value: function() { return fs.createReadStream(common.dir.fixture + '/unicycle.jpg'); }
  }
};
var fieldsPassed = false;

var server = http.createServer(function(req, res) {
  var body = '';
  var boundry = req.headers['content-type'].split('boundary=').pop();

  req.on('data', function (data) { body += data.toString('utf-8'); });
  req.on('end', function () {
    // Separate body into individual files/fields and remove leading and trailing content.
    var fields = body.split(boundry).slice(1, -1);
    var fieldNames = Object.keys(FIELDS);

    assert.ok(fields.length === fieldNames.length);

    for (var i = 0; i < fieldNames.length; i++) {
      assert.ok(fields[i].indexOf('name="' + fieldNames[i] + '"') > -1);

      if (!FIELDS[fieldNames[i]].expectedType) {
        assert.equal(fields[i].indexOf('Content-Type'), -1, 'Expecting ' + fieldNames[i] + ' not to have Content-Type');
      } else {
        assert.ok(fields[i].indexOf('Content-Type: ' + FIELDS[fieldNames[i]].expectedType) > -1, 'Expecting ' + fieldNames[i] + ' to have Content-Type ' + FIELDS[fieldNames[i]].expectedType);
      }
    }

    fieldsPassed = true;
    res.end();
  });
});

server.listen(common.port, function() {

  var form = new FormData();

  var field;
  for (var name in FIELDS) {
    if (!FIELDS.hasOwnProperty(name)) { continue; }

    field = FIELDS[name];
    // important to append ReadStreams within the same tick
    if ((typeof field.value == 'function')) {
      field.value = field.value();
    }
    form.append(name, field.value, field.options);
  }

  // custom params object passed to submit
  common.actions.submit(form, server);
});

process.on('exit', function() {
  assert.ok(fieldsPassed);
});
