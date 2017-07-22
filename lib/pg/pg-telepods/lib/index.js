'use strict'

const async = require('async')
const mkdirp = require('mkdirp')
const path = require('path')
const processUpserts = require('./process-upserts')
const processDeletes = require('./process-deletes')
const processCopy = require('./process-copy')

module.exports = function pgTelepods (options, callback) {
  options.deletesDir = path.join(options.outputDir, 'deletes')
  options.upsertsDir = path.join(options.outputDir, 'upserts')

  // Make sure 'deletes' and 'upserts' directories are ready
  async.each(
    [
      options.deletesDir,
      options.upsertsDir
    ],
    function (dirPath, cb) {
      mkdirp(dirPath, cb)
    },
    function (err) {
      if (err) {
        callback(err)
      } else {
        // Now run some tasks
        // 1: Create a new upserts file by streaming new/changed source rows
        // 2: Create a new deletes file by using PostgreSQL's copy command
        // 3: Run
        async.applyEachSeries(
          [
            processUpserts,
            processDeletes,
            processCopy
          ],
          options,
          callback
        )
      }
    }
  )
}
