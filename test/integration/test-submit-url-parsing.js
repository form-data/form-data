var http = require('http');
var https = require('https');
var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

/**
 * Test url parsing during submission
 */

var req;
var form = new FormData();
form.append('field', 'value');

// Basic parsing
req = form.submit('http://localhost/path', function() {});
assert.strictEqual(req.path, '/path');
assert.ok(req.agent instanceof http.Agent, 'req.agent instanceof http.Agent');
assert.strictEqual(req.getHeader('Host'), 'localhost');
req.abort();

// Non-default port handling
req = form.submit('http://localhost:' + common.port, function() {});
assert.strictEqual(req.getHeader('Host'), 'localhost:' + common.port);
req.abort();

// HTTPS protocol handling
req = form.submit('https://localhost/path', function() {});
assert.ok(req.agent instanceof https.Agent, 'req.agent instanceof https.Agent');
assert.strictEqual(req.getHeader('Host'), 'localhost');
req.abort();


