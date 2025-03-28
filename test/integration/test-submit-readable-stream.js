'use strict';

var common = require('../common');
var assert = common.assert;
var http = require('http');
var FormData = require(common.dir.lib + '/form_data');
var Readable = require('stream').Readable;
var util = require('util');

var server = http.createServer(function (req, res) {
  assert.strictEqual(req.headers['Content-Length'], undefined);
  res.writeHead(200);
  res.end('done');
});

server.listen(common.port, function () {
  var form = new FormData();

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
    // console.error('send back read data');
    if (i > this._max) {
      this.push(null);
    } else {
      this.push(String(i));
    }
  };
  form.append('readable', new CustomReadable());

  form.submit('http://localhost:' + common.port + '/', function (err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();
  });

});
