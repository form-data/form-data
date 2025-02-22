var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var predictV8Randomness = require('predict-v8-randomness');

var initialSequence = [
  Math.random(),
  Math.random(),
  Math.random(),
  Math.random(),
];
var predictor = new predictV8Randomness.Predictor(initialSequence);

predictor.predictNext(24).then(function (next24RandomOutputs) {
  var predictedBoundary = next24RandomOutputs
    .map(function (v) {
      return Math.floor(v * 10).toString(16);
    })
    .join('');

  var boundaryIntro = '----------------------------';

  var payload =
    'zzz\r\n' +
    boundaryIntro +
    predictedBoundary +
    '\r\nContent-Disposition: form-data; name="is_admin"\r\n\r\ntrue\r\n' +
    boundaryIntro +
    predictedBoundary +
    '--\r\n';

  var FIELDS = {
    my_field: {
      value: payload,
    },
  };

  // count total
  var fieldsPassed = Object.keys(FIELDS).length;

  // prepare form-receiving http server
  var server = common.testFields(FIELDS, function (fields) {
    fieldsPassed = fields;
  });

  server.listen(common.port, function () {
    var form = new FormData();

    common.actions.populateFields(form, FIELDS);

    common.actions.submit(form, server);
  });

  process.on('exit', function () {
    assert.strictEqual(fieldsPassed, 0);
  });
});
