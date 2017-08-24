var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

var form = new FormData({maxDataSize: 20 * 1024 * 1024});
assert.strictEqual(form.maxDataSize, 20 * 1024 * 1024);
