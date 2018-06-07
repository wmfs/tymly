'use strict'

const makeDir = require('make-dir')
const path = require('path')
const processUpserts = require('./process-upserts')
const processDeletes = require('./process-deletes')
const processCopy = require('./process-copy')

const NotSet = 'NotSet'

function pgTelepods (options, callback = NotSet) {
  if (callback === NotSet) {
    return telepods(options)
  } // if

  telepods(options)
    .then(() => callback(null))
    .catch(err => callback(err))
} // pgTelepods

async function telepods (options) {
  options.deletesDir = path.join(options.outputDir, 'deletes')
  options.upsertsDir = path.join(options.outputDir, 'upserts')

  // Make sure 'deletes' and 'upserts' directories are ready
  for (const dir of [ options.deletesDir, options.upsertsDir ]) {
    await makeDir(dir)
  }

  // Now run some tasks
  // 1: Create a new upserts file by streaming new/changed source rows
  await processUpserts(options)
  // 2: Create a new deletes file by using PostgreSQL's copy command
  await processDeletes(options)
  // 3: Run
  await processCopy(options)
} // pgTelepods

module.exports = pgTelepods
