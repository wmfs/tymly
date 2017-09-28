'use strict'

const _ = require('lodash')

module.exports = function getTables (fileInfo, options) {
  let tables = new Set()
  if (fileInfo.deletes) {
    Object.keys(fileInfo.deletes).forEach(function (key) {
      tables.add(`${_.snakeCase(options.schemaName)}.${_.snakeCase(fileInfo.deletes[key].tableName)}`)
    })
  }
  if (fileInfo.inserts) {
    Object.keys(fileInfo.inserts).forEach(function (key) {
      tables.add(`${_.snakeCase(options.schemaName)}.${_.snakeCase(fileInfo.inserts[key].tableName)}`)
    })
  }
  if (fileInfo.updates) {
    Object.keys(fileInfo.updates).forEach(function (key) {
      tables.add(`${_.snakeCase(options.schemaName)}.${_.snakeCase(fileInfo.updates[key].tableName)}`)
    })
  }
  if (fileInfo.upserts) {
    Object.keys(fileInfo.upserts).forEach(function (key) {
      tables.add(`${_.snakeCase(options.schemaName)}.${_.snakeCase(fileInfo.upserts[key].tableName)}`)
    })
  }
  return Array.from(tables)
}
