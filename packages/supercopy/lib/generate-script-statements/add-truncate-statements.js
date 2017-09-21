'use strict'

const _ = require('lodash')

module.exports = function addTruncateStatements (scriptStatements, fileInfo, options) {
  if (fileInfo.hasOwnProperty('truncateTables')) {
    for (const tableToBeTruncated of fileInfo.truncateTables) {
      scriptStatements.push(
        tableToBeTruncated.includes('.') ? `TRUNCATE TABLE ${_.snakeCase(tableToBeTruncated)} CASCADE;`
          : `TRUNCATE TABLE ${_.snakeCase(options.schemaName)}.${_.snakeCase(tableToBeTruncated)} CASCADE;`
      )
    }
  }
}
