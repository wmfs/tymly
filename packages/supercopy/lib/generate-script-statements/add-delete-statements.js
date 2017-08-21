'use strict'

const _ = require('lodash')
const addTempTableStatement = require('./add-temp-table-statement')

module.exports = function addDeleteStatements (scriptStatements, fileInfo, options) {
  if (fileInfo.hasOwnProperty('deletes')) {
    _.forOwn(
      fileInfo.deletes,
      function (info, filePath) {
        const tempTableName = addTempTableStatement(scriptStatements, 'delete', options.schemaName, info.tableName)

        scriptStatements.push(
          `COPY ${tempTableName}(${info.columnNames.all.join(',')}) FROM '${filePath}' CSV HEADER;`
        )

        scriptStatements.push(
          `DELETE FROM ${options.schemaName}.${_.snakeCase(info.tableName)} WHERE (${info.columnNames.all.join(',')}) IN (SELECT ${info.columnNames.all.join(',')} FROM ${tempTableName});`
        )

        scriptStatements.push(
          `DROP TABLE ${tempTableName};`
        )
      }
    )
  }
}
