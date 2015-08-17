// serves static files
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var common = require('./common');

// prepare tmp folder
if (!fs.existsSync(common.dir.tmp)) {
  fs.mkdirSync(common.dir.tmp);
}

module.exports = function(callback) {

  // create http server
  var httpServer = http.createServer(function(req, res) {

    var target = path.join(common.dir.fixture, req.url);
    var stat = fs.statSync(target);

    res.writeHead(200, {
      'Content-Type': mime.lookup(target),
      'Content-Length': stat.size
    });

    fs.createReadStream(target).pipe(res);
  });

  httpServer.listen(common.staticPort, callback.bind(undefined, httpServer));
};
