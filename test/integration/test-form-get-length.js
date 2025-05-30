var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var fake = require('fake').create();
var fs = require('fs');
var Readable = require('stream').Readable;
var util = require('util');

(function testEmptyForm() {
  var form = new FormData();
  var callback = fake.callback('testEmptyForm-getLength');
  var calls = fake.expectAnytime(callback, [null, 0]).calls;

  form.getLength(callback);

  // Make sure our response is async
  assert.strictEqual(calls.length, 0);
}());

(function testUtf8String() {
  var FIELD = 'my_field';
  var VALUE = 'May the € be with you';

  var form = new FormData();
  form.append(FIELD, VALUE);
  var callback = fake.callback('testUtf8String-getLength');

  var expectedLength = form._overheadLength + Buffer.byteLength(VALUE) + form._lastBoundary().length;

  fake.expectAnytime(callback, [null, expectedLength]);
  form.getLength(callback);
}());

(function testBuffer() {
  var FIELD = 'my_field';
  var VALUE = new Buffer(23);

  var form = new FormData();
  form.append(FIELD, VALUE);
  var callback = fake.callback('testBuffer-getLength');

  var expectedLength = form._overheadLength + VALUE.length + form._lastBoundary().length;

  fake.expectAnytime(callback, [null, expectedLength]);
  form.getLength(callback);
}());

(function testStringFileBufferFile() {
  var fields = [
    {
      name: 'my_field',
      value: 'Test 123'
    },
    {
      name: 'my_image',
      value: fs.createReadStream(common.dir.fixture + '/unicycle.jpg')
    },
    {
      name: 'my_buffer',
      value: new Buffer('123')
    },
    {
      name: 'my_txt',
      value: fs.createReadStream(common.dir.fixture + '/veggies.txt')
    }
  ];

  var form = new FormData();
  var expectedLength = 0;

  fields.forEach(function (field) {
    form.append(field.name, field.value);
    if (field.value.path) {
      var stat = fs.statSync(field.value.path);
      expectedLength += stat.size;
    } else {
      expectedLength += field.value.length;
    }
  });

  expectedLength += form._overheadLength + form._lastBoundary().length;

  var callback = fake.callback('testStringFileBufferFile-getLength');
  fake.expectAnytime(callback, [null, expectedLength]);
  form.getLength(callback);
}());

(function testReadableStreamData() {
  var form = new FormData();
  // var expectedLength = 0;

  /**
   * Custion readable constructor
   * @param {object} opt options
   * @constructor
   */
  function CustomReadable(opt) {
    Readable.call(this, opt);
    this._max = 2;
    this._index = 1;
  }

  util.inherits(CustomReadable, Readable);

  CustomReadable.prototype._read = function () {
    var i = this._index++;
    if (i > this._max) {
      this.push(null);
    } else {
      this.push(String(i));
    }
  };
  form.append('my_txt', new CustomReadable());

  // expectedLength += form._overheadLength + form._lastBoundary().length;

  // there is no way to determine the length of this readable stream.
  var callback = fake.callback(arguments.callee.name + '-getLength'); // eslint-disable-line no-restricted-properties
  fake.expectAnytime(callback, ['Unknown stream', undefined]);
  form.getLength(function (err, len) { callback(err, len); });
}());
