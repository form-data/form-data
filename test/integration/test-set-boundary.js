'use strict';

var common = require('../common');
var assert = common.assert;

var FormData = require(common.dir.lib + '/form_data');

(function testSetBoundary() {
  var userBoundary = '---something';
  var form = new FormData();
  form.setBoundary(userBoundary);

  assert.equal(form.getBoundary(), userBoundary);
}());

(function testUniqueBoundaryPerFormAfterSet() {
  var userBoundary = '---something';
  var formA = new FormData();
  formA.setBoundary(userBoundary);

  var formB = new FormData();

  assert.equal(formA.getBoundary(), userBoundary);
  assert.notEqual(formA.getBoundary(), formB.getBoundary());
}());

(function testsetBoundaryWithNonString_preExistingBehavior() {
  var form = new FormData();

  var nonStringValues = [123, { value: 123 }, ['---something']];
  nonStringValues.forEach(function (value) {
    form.setBoundary(value);
    assert.equal(form.getBoundary(), value);
  });
}());
