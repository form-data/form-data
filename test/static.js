// serves static files
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var common = require('./common');

module.exports = function(callback) {
  var server = http.createServer(function(req, res) {

    var target = path.join(common.dir.fixture, req.url);
    var stat = fs.statSync(target);

    res.writeHead(200, {
      'Content-Type': mime.lookup(target),
      'Content-Length': stat.size
    });

    fs.createReadStream(target).pipe(res);
  });
  server.listen(common.staticPort, callback.bind(undefined, server));
};
