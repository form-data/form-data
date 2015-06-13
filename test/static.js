// serves static files
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var common = require('./common');

// prepare tmp folder
if (!fs.existsSync(common.dir.tmp))
{
  fs.mkdirSync(common.dir.tmp);
}

// make it work with self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, './fixture/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, './fixture/cert.pem'))
};

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

  // create https server
  var httpsServer = https.createServer(httpsOptions, function(req, res) {
    res.writeHead(200, {'x-success': 'OK'});
    res.end('Great Success');
  });

  // dirty&simple
  httpServer.listen(common.staticPort, httpsServer.listen.bind(httpsServer, common.httpsPort, callback.bind(undefined, httpServer, httpsServer)));
};
