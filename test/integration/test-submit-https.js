var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

// testing default https port

// check params as string
testRequest('https://localhost:'+common.httpsPort+'/');

// check params as object
testRequest({protocol: 'https:', hostname: 'localhost', port: common.httpsPort, pathname: '/'});

// --- Santa's little helpers

function testRequest(params)
{
  var form;

  form = new FormData();

  form.submit(params, function(err, res)
  {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['x-success'], 'OK');

    // unstuck new streams
    res.resume();
  });

}
