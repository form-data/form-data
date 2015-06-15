var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var correctHostName = 'npmjs.org';
var correctPort = 80;

// testing default http port

// check params as string
testRequest('http://npmjs.org/');

testRequest('http://npmjs.org:80/');

// check params as object
testRequest({protocol: 'http:', hostname: 'npmjs.org', pathname: '/'});

testRequest({port: 80, hostname: 'npmjs.org', pathname: '/'});

testRequest({port: 80, protocol: 'http:', hostname: 'npmjs.org', pathname: '/'});

// --- Santa's little helpers

function testRequest(params)
{
  var form;
  var request;
  var sockets;
  var correctSocket = correctHostName+':'+correctPort;

  form = new FormData();

  // break getLength – prevent submit() from actually submitting
  form.getLength = function(){};

  request = form.submit(params);

  sockets = Object.keys(request.agent.sockets);

  assert.equal(sockets.length, 1);

  // in 0.10 it's "nodomain:80"
  // in 0.11 it's "nodomain:80::::::::"
  assert.equal(correctSocket, sockets[0].substr(0, correctSocket.length));

  // stop here
  request.abort();

  request.on('error', function(err){
    assert.equal(err.code, 'ECONNRESET');
  });

  return request;
}
