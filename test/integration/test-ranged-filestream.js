/*
test ranged fs.createReadStream
re: https://github.com/felixge/node-form-data/issues/71
*/

var common       = require('../common');
var assert       = common.assert;
var http         = require('http');
var fs           = require('fs');

var FormData     = require(common.dir.lib + '/form_data');
var IncomingForm = require('formidable').IncomingForm;

var testSubjects = {
  'a_file': {
    file: 'veggies.txt',
    start: 8,
    end: 18
  }, 'b_file': {
    file: 'veggies.txt',
    start: 6
  }, 'c_file': {
    file: 'veggies.txt',
    end: 16
  }, 'd_file': {
    file: 'veggies.txt',
    start: 0,
    end: 16
  }, 'e_file': {
    file: 'veggies.txt',
    start: 0,
    end: 0
  }
};

/**
 * Accumulates read data size
 *
 * @param   {string} data - chunk of read data
 */
function readSizeAccumulator(data) {
  this.readSize += data.length;
}

var server = http.createServer(function(req, res) {
  var requestBodyLength = 0;

  // calculate actual length of the request body
  req.on('data', function(data) {
    requestBodyLength += data.length;
  });

  req.on('end', function() {
    // make sure total Content-Length is properly calculated
    assert.equal(req.headers['content-length'], requestBodyLength);
    // successfully accepted request and it's good
    res.writeHead(200);
  });

  var form = new IncomingForm({uploadDir: common.dir.tmp});
  form.parse(req);

  form
    .on('file', function(name, file) {
      // make sure chunks are the same size
      assert.equal(file.size, testSubjects[name].readSize);
      // clean up tested subject
      delete testSubjects[name];
    })
    .on('end', function() {
      // done here
      res.end();
    });
});


server.listen(common.port, function() {
  var form = new FormData();
  var name, options;

  // add test subjects to the form
  for (name in testSubjects) {
    if (!testSubjects.hasOwnProperty(name)) {
      continue;
    }

    options = {encoding: 'utf8'};

    if (testSubjects[name].start) { options.start = testSubjects[name].start; }
    if (testSubjects[name].end) { options.end = testSubjects[name].end; }

    form.append(name, testSubjects[name].fsStream = fs.createReadStream(common.dir.fixture + '/' + testSubjects[name].file, options));

    // calculate data size
    testSubjects[name].readSize = 0;
    testSubjects[name].fsStream.on('data', readSizeAccumulator.bind(testSubjects[name]));
  }

  form.submit('http://localhost:' + common.port + '/', function(err, res) {
    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // wait for server to finish
    res.on('end', function() {
      // check that all subjects were tested
      assert.strictEqual(Object.keys(testSubjects).length, 0);
      server.close();
    });

    // unstuck new streams
    res.resume();
  });

});
