'use strict'

const addDeleteStatements = require('./add-delete-statements')
const addInsertStatements = require('./add-insert-statements')
const addUpdateStatements = require('./add-update-statements')
const addUpsertStatements = require('./add-upsert-statements')

module.exports = function generateScriptStatements (fileInfo, options) {
  const scriptStatements = ['BEGIN;']

  if (options.debug) {
    console.log(JSON.stringify(fileInfo, null, 2))
  }

  addDeleteStatements(scriptStatements, fileInfo, options)
  addInsertStatements(scriptStatements, fileInfo, options)
  addUpdateStatements(scriptStatements, fileInfo, options)
  addUpsertStatements(scriptStatements, fileInfo, options)

  scriptStatements.push('COMMIT;')

  return scriptStatements
}
