'use strict'

const path = require('path')
const _ = require('lodash')
const async = require('async')
const glob = require('glob')
const fs = require('fs')
const csvParser = require('csv-streamify')
const FileBuilder = require('./File-builder')
const Writer = require('./Writer')
const jsonfile = require('jsonfile')

module.exports = function smithereens (sourceFilePaths, options, callback) {
  // Turn sourceFilePaths to an array, if it's not already
  if (!_.isArray(sourceFilePaths)) {
    sourceFilePaths = [sourceFilePaths]
  }

  // Configure parser
  const parserOptions = options.parser
  parserOptions.objectMode = true
  parserOptions.columns = false
  const parser = csvParser(parserOptions)

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
                const writer = new Writer(fileBuilder, options)
                writer.on('finish', cb2)
                // Magic steam line
                fs.createReadStream(filePath).pipe(parser).pipe(writer)
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
