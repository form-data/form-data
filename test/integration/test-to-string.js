var common   = require('../common');
var assert   = common.assert;
var { FormData } = require(common.dir.lib + '/form-data');

assert(new FormData().toString() === '[object FormData]');
