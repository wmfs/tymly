'use strict'

const debug = require('debug')('supercopy')
const addTruncateStatements = require('./add-truncate-statements')
const addDeleteStatements = require('./add-delete-statements')
const addInsertStatements = require('./add-insert-statements')
const addUpdateStatements = require('./add-update-statements')
const addUpsertStatements = require('./add-upsert-statements')
const getTables = require('./get-tables')

module.exports = function generateScriptStatements (fileInfo, options) {
  const scriptStatements = ['BEGIN;']
  addTruncateStatements(scriptStatements, fileInfo, options)
  addDeleteStatements(scriptStatements, fileInfo, options)
  addInsertStatements(scriptStatements, fileInfo, options)
  addUpdateStatements(scriptStatements, fileInfo, options)
  addUpsertStatements(scriptStatements, fileInfo, options)
  scriptStatements.push('COMMIT;')

  let tables = getTables(fileInfo, options)
  for (let table of tables) {
    scriptStatements.push(`VACUUM ANALYZE ${table};`)
  }

  debug(`Statements to run ${JSON.stringify(scriptStatements, null, 2)}`)

  return scriptStatements
}
