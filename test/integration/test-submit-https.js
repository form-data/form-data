var https = require('https');
var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var server;

/**
 * Test submission to HTTPS endpoint
 */
function submitForm() {

  var form = new FormData();

  form.append('field', 'value');

  form.submit({
    protocol: 'https:',
    hostname: 'localhost',
    port: common.httpsPort,
    pathname: '/',
    // for self-signed certs on localhost
    secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
    ca: common.httpsServerCert
  }, function(err, res) {

    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['x-success'], 'OK');

    // unstuck new streams
    res.resume();

    server.close();
  });
}

// create https server
server = https.createServer({
  key: common.httpsServerKey,
  cert: common.httpsServerCert
}, function(req, res) {

  // old and simple
  req.on('data', function() {});

  req.on('end', function() {
    res.writeHead(200, {'x-success': 'OK'});
    res.end('Great Success');
  });
});

// when https server ready submit form
server.listen(common.httpsPort, submitForm);
