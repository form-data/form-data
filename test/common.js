var fs = require('fs');
var path = require('path');

var common = module.exports;

var rootDir = path.join(__dirname, '..');
common.dir = {
  lib: path.join(rootDir, '/lib'),
  fixture: path.join(rootDir, '/test/fixture'),
  tmp: path.join(rootDir, '/test/tmp')
};

common.assert = require('assert');
common.fake = require('fake');

common.port = 8432;

common.staticPort = 9432;
common.httpsPort = 9443;

// store server cert in common for later reuse, because self-signed
common.httpsServerKey = fs.readFileSync(path.join(__dirname, './fixture/key.pem'));
common.httpsServerCert = fs.readFileSync(path.join(__dirname, './fixture/cert.pem'));
