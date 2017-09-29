'use strict'

const debug = require('debug')('smithereens')
const path = require('path')
const _ = require('lodash')
const async = require('async')
const glob = require('glob')
const fs = require('fs')
const csvParser = require('csv-streamify')
const FileBuilder = require('./File-builder')
const Writer = require('./Writer')
const jsonfile = require('jsonfile')
const pump = require('pump')

module.exports = function smithereens (sourceFilePaths, options, callback) {
  // Turn sourceFilePaths to an array, if it's not already
  if (!_.isArray(sourceFilePaths)) {
    sourceFilePaths = [sourceFilePaths]
  }

  debug('sourceFilePaths:' + JSON.stringify(sourceFilePaths, null, 2))
  debug('options:' + JSON.stringify(options, null, 2))

  // Configure parser
  const parserOptions = options.parser
  parserOptions.objectMode = true
  parserOptions.columns = false

  // Create a file builder
  const fileBuilder = new FileBuilder(options)

  async.eachSeries(
    sourceFilePaths,
    // Loop over all provided file locations
    function (fileSource, cb) {
      glob(
        fileSource,
        {
          nodir: true
        },
        function (err, files) {
          if (err) {
            cb(err)
          } else {
            // Loop over all absolute file locations
            async.eachSeries(
              files,
              function (filePath, cb2) {
                cb2 = _.once(cb2)
                debug(`Streaming files from ${filePath}`)

                const rs = fs.createReadStream(filePath)
                const parser = csvParser(parserOptions)
                const writer = new Writer(fileBuilder, options)

                pump(
                  rs,
                  parser,
                  writer,
                  cb2
                )
              },
              function (err) {
                if (err) {
                  cb(err)
                } else {
                  cb(null)
                }
              }
            )
          }
        }
      )
    },
    function (err) {
      if (err) {
        callback(err)
      } else {
        fileBuilder.close()
        const manifest = fileBuilder.getManifest()

        jsonfile.writeFile(
          path.join(fileBuilder.outputDirRootPath, 'manifest.json'),
          manifest,
          {
            spaces: 2
          },
          function (err) {
            if (err) {
              callback(err)
            } else {
              callback(null, manifest)
            }
          }
        )
      }
    }
  )
}
