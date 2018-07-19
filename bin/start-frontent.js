#!/usr/bin/env node
(function () {
  'use strict'

  var args = require('./argparse').parse()
  var cwd

  cwd = args.change_dir || process.cwd()
  args.packageRoot = cwd
  console.log(cwd)
}())
