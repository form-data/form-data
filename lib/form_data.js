var http = require('http');
var oop = require('oop');
var Stream = require('stream').Stream;

module.exports = FormData;
oop.extend(FormData, Stream);
var formData = FormData.prototype;

function FormData() {
  Stream.call(this);

  this.readable = true;
  this.paused = true;

  this._parts = [];
  this._streamPart = null;

  this._boundary = null;
  this._partBegin = null;
}

formData._init = function() {
  // This generates a 50 character boundary similar to those used by Firefox.
  // They are optimized for boyer-moore parsing.
  var boundary = '--------------------------';
  for (var i = 0; i < 24; i++) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  this._partBegin = new Buffer('--' + boundary + '\r\n');
  this._boundary = boundary;
};

formData.getBoundary = function() {
  if (!this._boundary) {
    this._init();
  }

  return this._boundary;
};

formData.append = function(name, value) {
  this._parts.push({
    name: name,
    value: value,
  });
};

formData.pipe = function(destination) {
  var r = Stream.prototype.pipe.call(this, destination);
  this.resume();
  return r;
};

formData.resume = function() {
  if (!this._boundary) {
    this._init();
  }

  this.paused = false;
  process.nextTick(this._emitData.bind(this));
};

formData.pause = function() {
  this.paused = true;
  //if (this._streamPart) {
    //this._streamPart.pause();
  //}
};

formData._emitData = function() {
  if (this.paused) {
    return;
  }

  var part = this._parts.shift();
  if (!part) {
    return;
  }

  if (part.value instanceof Stream) {
    this._emitStreamPart(part);
  } else {
    this._emitRegularPart(part);
  }
};

formData._emitRegularPart = function(part) {
  var header = 'Content-Disposition: form-data; name="' + part.name + '"';
  header += '\r\n\r\n';

  this.emit('data', this._partBegin);
  this.emit('data', new Buffer(header + part.value + '\r\n', 'utf8'));

  if (this._parts.length === 0) {
    this._emitEndBoundary();
    this.readable = false;
  } else {
    this._emitData();
  }
};

formData._emitEndBoundary = function() {
  this.emit('data', new Buffer('--' + this._boundary + '--\r\n'));
};
