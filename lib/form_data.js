var CombinedStream = require('combined-stream');
var util = require('util');
var path = require('path');
var mime = require('mime');

module.exports = FormData;
function FormData() {
  CombinedStream.call(this);
}
util.inherits(FormData, CombinedStream);

FormData.prototype.append = function(field, value) {
  var parentAppend = CombinedStream.prototype.append;

  parentAppend.call(this, this._multiPartHeader.bind(this, field, value));
  parentAppend.call(this, value);
  parentAppend.call(this, this._multiPartFooter.bind(this, field, value));
};

FormData.prototype._multiPartHeader = function(field, value, next) {
  var boundary = this.getBoundary();

  var header =
    '--' + boundary
    + '\r\n'
    + 'Content-Disposition: form-data; name="' + field + '"';

  if (value.path) {
    header +=
      '; filename="' + path.basename(value.path) + '"\r\n'
      + 'Content-Type: ' + mime.lookup(value.path);
  }

  header += '\r\n\r\n';

  next(header);
};

FormData.prototype._multiPartFooter = function(field, value, next) {
  var footer = '\r\n';

  var lastPart = (this._streams.length === 0);
  if (lastPart) {
    footer += '--' + this.getBoundary() + '--';
  }

  next(footer);
};

FormData.prototype.getHeaders = function(userHeaders) {
  var formHeaders = {
    'content-type': 'multipart/form-data; boundary=' + this.getBoundary(),
  };

  for (var header in userHeaders) {
    formHeaders[header.toLowerCase()] = userHeaders[header];
  }

  return formHeaders;
}

FormData.prototype.getBoundary = function() {
  if (!this._boundary) {
    this._generateBoundary();
  }

  return this._boundary;
};

FormData.prototype._generateBoundary = function() {
  // This generates a 50 character boundary similar to those used by Firefox.
  // They are optimized for boyer-moore parsing.
  var boundary = '--------------------------';
  for (var i = 0; i < 24; i++) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  this._boundary = boundary;
};
