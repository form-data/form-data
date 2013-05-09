#!/usr/bin/env node
var far = require('far').create();

if (process.env.verbose)
{
  far.verbose(process.env.verbose);
}

far.add(__dirname);
far.include(/test-.*\.js$/);

far.execute();
