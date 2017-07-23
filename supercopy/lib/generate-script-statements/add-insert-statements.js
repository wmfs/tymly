'use strict'

const _ = require('lodash')

module.exports = function addInsertStatements (scriptStatements, fileInfo, options) {
  if (fileInfo.hasOwnProperty('inserts')) {
    _.forOwn(
      fileInfo.inserts,
      function (info, filePath) {
        scriptStatements.push(
          `COPY ${_.snakeCase(options.schemaName)}.${_.snakeCase(info.tableName)}(${info.columnNames.all.join(',')}) FROM '${filePath}' CSV HEADER;`
        )
      }
    )
  }
}
