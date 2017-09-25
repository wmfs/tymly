'use strict'

const collectFileInfo = require('./collect-file-info')
const generateScriptStatements = require('./generate-script-statements')
const scriptRunner = require('./script-runner')
const convertToCsv = require('./convert-to-csv.js')
const path = require('path')
const fs = require('fs')

function preprocess (options, callback) {
  if (!options.triggerElement) {
    return callback()
  }
  const outputFile = `${path.sep + path.basename(options.xmlSourceFile, path.extname(options.xmlSourceFile))}.csv`
  const outputPath = path.resolve(options.sourceDir, 'inserts')
  createFolders(outputPath)
  const absolutePathAndFilename = outputPath + outputFile
  convertToCsv(options.triggerElement, options.xmlSourceFile, absolutePathAndFilename, callback)
}

function createFolders (targetDir) {
  const sep = path.sep
  const initDir = path.isAbsolute(targetDir) ? sep : ''
  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir)
    if (!fs.existsSync(curDir)) {
      fs.mkdirSync(curDir)
    }
    return curDir
  }, initDir)
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
