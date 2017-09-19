/* eslint-env mocha */
'use strict'

const collectFileInfo = require('./collect-file-info')
const generateScriptStatements = require('./generate-script-statements')
const scriptRunner = require('./script-runner')
const convertToCsv = require('./convert-to-csv.js')
const path = require('path')

function preprocess (options, callback) {
  if (!options.triggerElement) {
    return callback()
  }
  const csvOutput = path.resolve(options.sourceDir, './inserts/adults.csv')
  convertToCsv(options.triggerElement, options.xmlSourceFile, csvOutput, callback)
}

module.exports = function supercopy (options, callback) {
  preprocess(options, () => {
    collectFileInfo(options, function (err, fileInfo) {
      if (err) {
        callback(err)
      } else {
        const scriptStatements = generateScriptStatements(fileInfo, options)
        scriptRunner(
          scriptStatements,
          options.client,
          options,
          callback
        )
      }
    })
  })
}
