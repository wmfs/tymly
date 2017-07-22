'use strict'

const _ = require('lodash')
const addTempTableStatement = require('./add-temp-table-statement')

module.exports = function addUpdateStatements (scriptStatements, fileInfo, options) {
  if (fileInfo.hasOwnProperty('updates')) {
    _.forOwn(
      fileInfo.updates,
      function (info, filePath) {
        const tempTableName = addTempTableStatement(scriptStatements, 'update', _.snakeCase(options.schemaName), _.snakeCase(info.tableName))
        scriptStatements.push(
          `COPY ${tempTableName}(${info.columnNames.all.join(',')}) FROM '${filePath}' CSV HEADER;`
        )

        const setClauseExpressions = _.map(
          info.columnNames.attributes,
          function (columnName) {
            return `${columnName}=stage.${columnName}`
          })
        const primaryKeyColumnExpressions = _.map(
          info.columnNames.pk,
          function (columnName) {
            return `target.${columnName}=stage.${columnName}`
          })

        scriptStatements.push(
          `UPDATE ${_.snakeCase(options.schemaName)}.${_.snakeCase(info.tableName)} AS target SET ${setClauseExpressions.join(',')} FROM (SELECT * FROM ${tempTableName}) AS stage WHERE ${primaryKeyColumnExpressions.join(' AND ')};`
        )

        scriptStatements.push(
          `DROP TABLE ${tempTableName};`
        )
      }
    )
  }
}
