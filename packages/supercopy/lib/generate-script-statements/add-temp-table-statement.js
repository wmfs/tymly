const _ = require('lodash')

module.exports = function addTempTableStatement (statements, action, schemaName, tableName) {
  const tempTableName = `${action}_${_.snakeCase(schemaName)}_${_.snakeCase(tableName)}`

  statements.push(
    `CREATE TEMP TABLE ${tempTableName} ON COMMIT DROP AS SELECT * FROM ${_.snakeCase(schemaName)}.${_.snakeCase(tableName)} WITH NO DATA;`
  )

  return tempTableName
}
