/* eslint-env mocha */
'use strict'

const collectFileInfo = require('./collect-file-info')
const generateScriptStatements = require('./generate-script-statements')
const scriptRunner = require('./script-runner')

module.exports = function supercopy (options, callback) {
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
}
