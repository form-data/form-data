#!/usr/bin/env node
var static = require('./static');
var far = require('far').create();

if (process.env.verbose)
{
  far.verbose(process.env.verbose);
}

far.add(__dirname);
far.include(/test-.*\.js$/);

// start static server for all tests
static(function()
{
  far.execute();
});
