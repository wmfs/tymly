'use strict'

const supercopy = require('supercopy')
const fs = require('fs')
const path = require('path')

module.exports = function (dirs, client) {
  const schemaTablePairs = getSchemaTablePairs(dirs)

  const supercopyOperations = schemaTablePairs.map(([schema, table]) => {
    const csvPath = path.resolve(dirs, schema)
    return supercopy({
      sourceDir: path.resolve(csvPath, table),
      headerColumnNamePkPrefix: '.',
      client: client,
      schemaName: schema,
      truncateTables: true,
      debug: true
    })
  })

  return Promise.all(supercopyOperations)
} // multicopy

function getDirs (dirs) {
  return fs.readdirSync(dirs).filter(file => fs.statSync(path.join(dirs, file)).isDirectory())
} // getDirs

function getSchemaTablePairs (dirs) {
  const schemaTablePairs = []

  const schemas = getDirs(dirs)
  schemas.forEach(schema => {
    let tables = getDirs(path.resolve(dirs, schema))
    tables.forEach(table => schemaTablePairs.push([schema, table]))
  })

  return schemaTablePairs
} // getSchemaTablePairs
