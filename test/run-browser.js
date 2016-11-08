var test = require('tape');
var FormData = require('../lib/browser.js');
var form = new FormData();

test('being nice to browser-like environments', function(t)
{
  t.plan(3);
  t.notEqual(typeof FormData, 'undefined', 'FormData should be defined');
  t.equal(typeof form, 'object', 'FormData instance should be object');
  t.equal(typeof form.append, 'function', 'FormData instance should have `append` method');
});
