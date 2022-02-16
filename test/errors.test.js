var common = require('./common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var path = require('path');
var fs = require('fs');
var http = require('http');

describe('errors', () => {
  test('append array', () => {
    // https://github.com/felixge/node-form-data/issues/38

    var form = new FormData();

    const f = jest.fn();
    
    form.on('error', function(err) {
      // workaround for expectAnytime handling objects
      f(err.message);
    });

    form.append('my_array', ['bird', 'cute']);

    expect(f).toHaveBeenCalledWith('Arrays are not supported.');
  });

  test('get length sync', () => {
    var fields = [
      {
        name: 'my_string',
        value: 'Test 123'
      },
      {
        name: 'my_image',
        value: fs.createReadStream(common.dir.fixture + '/unicycle.jpg')
      }
    ];

    var form = new FormData();
    var expectedLength = 0;

    fields.forEach(function(field) {
      form.append(field.name, field.value);
      if (field.value.path) {
        var stat = fs.statSync(field.value.path);
        expectedLength += stat.size;
      } else {
        expectedLength += field.value.length;
      }
    });
    expectedLength += form._overheadLength + form._lastBoundary().length;


    const f = jest.fn();

    form.on('error', function(err) {
      // workaroud for expectAnytime handling objects
      f(err.message);
    });

    var calculatedLength = form.getLengthSync();

    // getLengthSync DOESN'T calculate streams length
    assert.ok(expectedLength > calculatedLength);

    expect(f).toHaveBeenCalledWith('Cannot calculate proper length in synchronous way.');
  });

  test('stream error', (done) => {
    var req;
    var form = new FormData();
    // make it windows friendly
    var fakePath = path.resolve('/why/u/no/exists');
    var src = fs.createReadStream(fakePath);
    var server = http.createServer();
    var addr = 'http://localhost:' + common.port;

    form.append('fake-stream', src);

    form.on('error', function(err) {
      assert.equal(err.code, 'ENOENT');
      assert.equal(err.path, fakePath);
      req.on('error', function() {});
      server.close();
      done();
    });

    server.listen(common.port, function() {
      req = form.submit(addr);
    });
  });
});