var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var fs = require('fs');
var Readable = require('stream').Readable;

(function testGetLengthSync() {
  var fields = [
    {
      name: 'my_number',
      value: 123
    },
    {
      name: 'my_string',
      value: 'Test 123'
    },
    {
      name: 'my_buffer',
      value: new Buffer('123')
    }
  ];

  var form = new FormData();
  var expectedLength = 0;

  fields.forEach(function(field) {
    form.append(field.name, field.value);
    expectedLength += ('' + field.value).length;
  });

  expectedLength += form._overheadLength + form._lastBoundary().length;
  var calculatedLength = form.getLengthSync();

  assert.equal(expectedLength, calculatedLength);
})();


(function testGetLengthSyncWithKnownLength() {
  var fields = [
    {
      name: 'my_number',
      value: 123
    },
    {
      name: 'my_string',
      value: 'Test 123'
    },
    {
      name: 'my_buffer',
      value: new Buffer('123')
    },
    {
      name: 'my_image',
      value: fs.createReadStream(common.dir.fixture + '/unicycle.jpg'),
      options: { knownLength: fs.statSync(common.dir.fixture + '/unicycle.jpg').size }
    }
  ];

  var form = new FormData();
  var expectedLength = 0;

  fields.forEach(function(field) {
    form.append(field.name, field.value, field.options);
    if (field.value.path) {
      var stat = fs.statSync(field.value.path);
      expectedLength += stat.size;
    } else {
      expectedLength += ('' + field.value).length;
    }
  });
  expectedLength += form._overheadLength + form._lastBoundary().length;

  var calculatedLength = form.getLengthSync();

  assert.equal(expectedLength, calculatedLength);
})();

(function testReadableStreamData() {
  var form = new FormData();

  var util = require('util');
  util.inherits(CustomReadable, Readable);

  /**
   * Custion readable constructor
   * @param       {Object} opt options
   * @constructor
   */
  function CustomReadable(opt) {
    Readable.call(this, opt);
    this._max = 2;
    this._index = 1;
  }

  CustomReadable.prototype._read = function() {
    var i = this._index++;
    if (i > this._max) {
      this.push(null);
    } else {
      this.push('' + i);
    }
  };
  form.append('my_txt', new CustomReadable());

  assert.throws(function() { form.getLengthSync(); }, /Cannot calculate proper length in synchronous way/);

})();
