var common = module.exports;
var path = require('path');

var rootDir = path.join(__dirname, '..');
common.dir = {
  lib: rootDir + '/lib',
  fixture: rootDir + '/test/fixture',
  tmp: rootDir + '/test/tmp',
};

common.assert = require('assert');
common.fake = require('fake');

common.port = 8432;

common.staticPort = 9432;
common.httpsPort = 9443;
