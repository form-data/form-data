var common = require('./common');
var FormData = require(common.dir.lib + '/form_data');
var fs = require('fs');
var Readable = require('stream').Readable;

describe('form-get-length', () => {
  test('emptyForm', () => {
    var form = new FormData();
    const callback = jest.fn();
  
    form.getLength(callback);
  
    // Make sure our response is async
    expect(callback).toHaveBeenCalledTimes(0);
    process.nextTick(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
  
  
  test('utf8String', (done) => {
    var FIELD = 'my_field';
    var VALUE = 'May the € be with you';
  
    var form = new FormData();
    form.append(FIELD, VALUE);
  
    var expectedLength =
      form._overheadLength +
      Buffer.byteLength(VALUE) +
      form._lastBoundary().length;
  
    form.getLength((err, length) => {
      expect(err).toBe(null);
      expect(length).toBe(expectedLength);
      done();
    });
  });
  
  test('buffer', (done) => {
    var FIELD = 'my_field';
    var VALUE = new Buffer.alloc(23);
  
    var form = new FormData();
    form.append(FIELD, VALUE);
  
    var expectedLength =
      form._overheadLength +
      VALUE.length +
      form._lastBoundary().length;
  
    form.getLength((err, length) => {
      expect(err).toBe(null);
      expect(length).toBe(expectedLength);
      done();
    });
  });
  
  test('stringFileBufferFile', (done) => {
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
        value: Buffer.from('123')
      },
      {
        name: 'my_txt',
        value: fs.createReadStream(common.dir.fixture + '/veggies.txt')
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
  
    form.getLength((err, length) => {
      expect(err).toBe(null);
      expect(length).toBe(expectedLength);
      done();
    });
  });
  
  test('readableStreamData', (done) => {
    var form = new FormData();
    // var expectedLength = 0;
  
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
  
    // expectedLength += form._overheadLength + form._lastBoundary().length;
  
    // there is no way to determine the length of this readable stream.
    form.getLength((err, length) => {
      expect(err).toBe('Unknown stream');
      expect(length).toBeUndefined;
      done();
    });
  
  });
});
