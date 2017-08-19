'use strict'

const _ = require('lodash')
const addTempTableStatement = require('./add-temp-table-statement')

module.exports = function addUpsertStatements (scriptStatements, fileInfo, options) {
  if (fileInfo.hasOwnProperty('upserts')) {
    _.forOwn(
      fileInfo.upserts,
      function (info, filePath) {
        const tempTableName = addTempTableStatement(scriptStatements, 'update', _.snakeCase(options.schemaName), _.snakeCase(info.tableName))
        scriptStatements.push(
          `COPY ${tempTableName}(${info.columnNames.all.join(',')}) FROM '${filePath}' CSV HEADER;`
        )

        const setClauseExpressions = _.map(
          info.columnNames.attributes,
          function (columnName) {
            return `${columnName}=EXCLUDED.${columnName}`
          })

        scriptStatements.push(
          `INSERT INTO ${_.snakeCase(options.schemaName)}.${_.snakeCase(info.tableName)}(${info.columnNames.all.join(',')}) SELECT ${info.columnNames.all.join(',')} FROM ${tempTableName} ON CONFLICT (${info.columnNames.pk.join(',')}) DO UPDATE SET ${setClauseExpressions.join(',')}`
        )

        scriptStatements.push(
          `DROP TABLE ${tempTableName};`
        )
      }
    )
  }
}
