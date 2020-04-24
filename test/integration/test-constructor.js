/**
 * Tests that the form data constructor is used with the new operator.
 */
var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');

assert.throws(FormData, 'Failed to construct \'FormData\': Please use the \'new\' operator.');
