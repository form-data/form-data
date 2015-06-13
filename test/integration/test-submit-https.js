var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

var form = new FormData();

form.submit({
  protocol: 'https:',
  hostname: 'localhost',
  port: common.httpsPort,
  pathname: '/',
  ca: common.httpsServerCert
}, function(err, res) {

  if (err) {
    throw err;
  }

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.headers['x-success'], 'OK');

  // unstuck new streams
  res.resume();
});
