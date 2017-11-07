'use strict'

const collectFileInfo = require('./collect-file-info')
const generateScriptStatements = require('./generate-script-statements')
const scriptRunner = require('./script-runner')
const path = require('path')
const fs = require('fs')
const promisify = require('util').promisify

function preprocess (options, callback) {
  const outputPath = path.resolve(options.sourceDir, 'inserts')
  createFolders(outputPath)
  callback()
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

function supercopy (options, callback) {
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

const NotSet = 'NotSet'
const supercopyP = promisify(supercopy)

module.exports = (options, callback = NotSet) => {
  if (callback === NotSet) {
    return supercopyP(options)
  }
  supercopy(options, callback)
}
