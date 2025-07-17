'use strict';

var common = require('../common');
var assert = common.assert;
var FormData = require(common.dir.lib + '/form_data');
var satisfies = require('semver').satisfies;
var jsrp = satisfies(process.version, '>= 17') && require('js-randomness-predictor'); // eslint-disable-line global-require

var predictor = jsrp && jsrp.node();

/**
 * Predicts the next random outputs from the V8 engine's random number generator.
 *
 * @param {JsRandomnessPredictor} predictorInstance - The instance of the randomness predictor.
 * @param {number} count - The number of random outputs to predict.
 * @returns {Promise<number[]>} A promise that resolves with the predicted random outputs or rejects with an error.
 */
function predictMany(predictorInstance, count) {
  return new Promise(function (resolve, reject) {
    var outputs = [];

    /** Recursive function to predict the next random output */
    function predictOne() {
      predictorInstance.predictNext().then(function (nextOutput) {
        outputs.push(nextOutput);

        if (outputs.length < count) {
          predictOne();
        } else {
          resolve(outputs);
        }
      }).catch(reject);
    }

    predictOne();
  });
}

if (predictor) {
  predictMany(predictor, 24).then(function (next24RandomOutputs) {
    var predictedBoundary = next24RandomOutputs
      .map(function (v) {
        return Math.floor(v * 10).toString(16);
      })
      .join('');

    var boundaryIntro = '----------------------------';

    var payload = 'zzz\r\n' + boundaryIntro + predictedBoundary + '\r\nContent-Disposition: form-data; name="is_admin"\r\n\r\ntrue\r\n' + boundaryIntro + predictedBoundary + '--\r\n';

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
}
