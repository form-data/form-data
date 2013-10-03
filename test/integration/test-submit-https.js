var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var correctSocket = 'npmjs.org:443';

// testing default https port

// check params as string
testRequest('https://npmjs.org/');

// check params as object
testRequest({protocol: 'https:', hostname: 'npmjs.org', pathname: '/'});

// --- Santa's little helpers

function testRequest(params)
{
  var form;
  var request;
  var sockets;

  form = new FormData();

  // break getLength – prevent submit() from actually submitting
  form.getLength = function(){};

  request = form.submit(params);

  sockets = Object.keys(request.agent.sockets);

  assert.equal(sockets.length, 1);

  // in 0.10 it's "nodomain:443"
  // in 0.11 it's "nodomain:443::::::::"
  assert.equal(correctSocket, sockets[0].substr(0, correctSocket.length));

  // stop here
  request.abort();

  request.on('error', function(err){
    assert.equal(err.code, 'ECONNRESET');
  });

  return request;
}
