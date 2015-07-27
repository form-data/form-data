var common = require('../common');
var assert = common.assert;
var http = require('http');
var mime = require('mime-types');
var fs = require('fs');
var FormData = require(common.dir.lib + '/form_data');

// wrap non simple values into function
// just to deal with ReadStream "autostart"
// Can't wait for 0.10
var FIELDS = {
  'no_type': {
    value: 'my_value'
  },
  'custom_type': {
    value: 'my_value',
    type: 'image/png',
    options: {
        contentType: 'image/png'
    }
  },
  'default_type': {
    type: FormData.DEFAULT_CONTENT_TYPE,
    value: function(){ return new Buffer([1, 2, 3]); }
  },
  'implicit_type': {
    type: mime.lookup(common.dir.fixture + '/unicycle.jpg'),
    value: function(){ return fs.createReadStream(common.dir.fixture + '/unicycle.jpg'); }
  }
};

var server = http.createServer(function(req, res) {
    var body = '';
    var boundry = req.headers['content-type'].split('boundary=').pop();

    req.on('data', function (data) { body += data.toString('utf-8'); });
    req.on('end', function () {
        // Separate body into individual files/fields and remove leading and trailing content.
        var fields = body.split(boundry).slice(1, -1);

        assert.ok(fields.length === 4);
        
        assert.ok(fields[0].indexOf('name="no_type"') > -1);
        assert.ok(fields[0].indexOf('Content-Type"') === -1);
        
        assert.ok(fields[1].indexOf('name="custom_type"') > -1);
        assert.ok(fields[1].indexOf('Content-Type: ' + FIELDS.custom_type.type) > -1);
        
        assert.ok(fields[2].indexOf('name="default_type"') > -1);
        assert.ok(fields[2].indexOf('Content-Type: ' + FIELDS.default_type.type) > -1);

        assert.ok(fields[3].indexOf('name="implicit_type"') > -1);
        assert.ok(fields[3].indexOf('Content-Type: ' + FIELDS.implicit_type.type) > -1);
    });
    res.end();

});

server.listen(common.port, function() {

  var form = new FormData();
  
  var field;
  for (var name in FIELDS) {
    field = FIELDS[name];
    // important to append ReadStreams within the same tick
    if ((typeof field.value == 'function')) {
      field.value = field.value();
    }
    form.append(name, field.value, field.options);
  }

  // custom params object passed to submit
  form.submit({
    port: common.port,
    path: '/'
  }, function(err, res) {

    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();
  });

});