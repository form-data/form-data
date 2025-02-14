'use strict';

var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

assert(String(new FormData()) === '[object FormData]');
