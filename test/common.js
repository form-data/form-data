var fs = require('fs');
var path = require('path');
var assert = require('assert');
var fake = require('fake');
var mime = require('mime-types');
var http = require('http');
var IncomingForm = require('formidable').IncomingForm;

var common = module.exports;

var rootDir = path.join(__dirname, '..');
common.dir = {
  lib: path.join(rootDir, '/lib'),
  fixture: path.join(rootDir, '/test/fixture'),
  tmp: path.join(rootDir, '/test/tmp')
};

common.defaultTypeValue = function () {
  return new Buffer([1, 2, 3]);
};

common.assert = assert;
common.fake = fake;

common.port = 8432;

common.staticPort = 9432;
common.httpsPort = 9443;

// store server cert in common for later reuse, because self-signed
common.httpsServerKey = fs.readFileSync(path.join(__dirname, './fixture/key.pem'));
common.httpsServerCert = fs.readFileSync(path.join(__dirname, './fixture/cert.pem'));

common.testFields = function (FIELDS, callback) {

  var fieldsPassed = Object.keys(FIELDS).length;

  return http.createServer(function (req, res) {

    var incomingForm = new IncomingForm({uploadDir: common.dir.tmp});

    incomingForm.parse(req);
    
    common.actions.checkForm(incomingForm, FIELDS, function (fieldsChecked) {
      // keep track of number of the processed fields
      callback(fieldsPassed - fieldsChecked);
      // finish it
      common.actions.formOnEnd(res);
    });
  });
};

// Actions

common.actions = {};

// generic form field population
common.actions.populateFields = function(form, fields)
{
  var field;
  for (var name in fields) {
    if (!fields.hasOwnProperty(name)) { continue; }

    field = fields[name];
    // important to append ReadStreams within the same tick
    if ((typeof field.value == 'function')) {
      field.value = field.value();
    }
    form.append(name, field.value);
  }
};

// generic form submit
common.actions.submit = function(form, server)
{
  return form.submit('http://localhost:' + common.port + '/', function(err, res) {

    if (err) {
      throw err;
    }

    assert.strictEqual(res.statusCode, 200);

    // unstuck new streams
    res.resume();

    server.close();
  });
};

common.actions.checkForm = function(form, fields, callback)
{
  var fieldChecked = 0;

  form
    .on('field', function(name, value) {
      fieldChecked++;
      common.actions.formOnField(fields, name, value);
    })
    .on('file', function(name, file) {
      fieldChecked++;
      common.actions.formOnFile(fields, name, file);
    })
    .on('end', function() {
      callback(fieldChecked);
    });
};

common.actions.basicFormOnField = function(name, value) {
  assert.strictEqual(name, 'my_field');
  assert.strictEqual(value, 'my_value');
};

common.actions.formOnField = function(FIELDS, name, value) {
  assert.ok(name in FIELDS);
  var field = FIELDS[name];
  assert.strictEqual(value, field.value + '');
};

common.actions.formOnFile = function(FIELDS, name, file) {
  assert.ok(name in FIELDS);
  var field = FIELDS[name];
  assert.strictEqual(file.name, path.basename(field.value.path || field.name));
  assert.strictEqual(file.type, field.type ? field.type : mime.lookup(file.name));
};

// after form has finished parsing
common.actions.formOnEnd = function(res) {
  res.writeHead(200);
  res.end('done');
};
