'use strict'

const addTruncateStatements = require('./add-truncate-statements')
const addDeleteStatements = require('./add-delete-statements')
const addInsertStatements = require('./add-insert-statements')
const addUpdateStatements = require('./add-update-statements')
const addUpsertStatements = require('./add-upsert-statements')
const debug = require('debug')('supercopy')

module.exports = function generateScriptStatements (fileInfo, options) {
  debug(fileInfo)
  const scriptStatements = ['BEGIN;']
  addTruncateStatements(scriptStatements, fileInfo)
  addDeleteStatements(scriptStatements, fileInfo, options)
  addInsertStatements(scriptStatements, fileInfo, options)
  addUpdateStatements(scriptStatements, fileInfo, options)
  addUpsertStatements(scriptStatements, fileInfo, options)
  scriptStatements.push('COMMIT;')

  debug(`Statements to run ${JSON.stringify(scriptStatements, null, 2)}`)

  return scriptStatements
}
