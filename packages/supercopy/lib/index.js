'use strict'

const collectFileInfo = require('./collect-file-info')
const generateScriptStatements = require('./generate-script-statements')
const scriptRunner = require('./script-runner')
const path = require('path')
const fs = require('fs')
const copyStream  = require('./copy-stream')
const promisify = require('util').promisify

function preprocess (options) {
  const outputPath = path.resolve(options.sourceDir, 'inserts')
  createFolders(outputPath)
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

function annotateCopyStatements(statements) {
  for (const statement of statements) {
    if (statement.sql.startsWith('COPY ')) {
      statement.action = copyStream
    } // if ...
  } // for ...
  return statements
} // annotateCopyStatements

function supercopy (options, callback) {
  preprocess(options)

  collectFileInfo(options).
    then(fileInfo => generateScriptStatements(fileInfo, options)).
    then(statements => annotateCopyStatements(statements)).
    then(scriptStatements => scriptRunner(
        scriptStatements,
        options.client,
        callback
      )).
    catch(err => callback(err))
}

const NotSet = 'NotSet'
const supercopyP = promisify(supercopy)

module.exports = (options, callback = NotSet) => {
  if (callback === NotSet) {
    return supercopyP(options)
  }
  supercopy(options, callback)
}
