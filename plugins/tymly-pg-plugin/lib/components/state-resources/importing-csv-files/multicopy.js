'use strict'

const supercopy = require('supercopy')
const fs = require('fs')
const path = require('path')

exports.refresh = function (dirs, client, callback) {
  let schemas = getDirs(dirs)

  const schemaTablePairs = []

  schemas.forEach(schema => {
    let tables = getDirs(path.resolve(dirs, schema))
    tables.forEach(table => schemaTablePairs.push([schema, table]))
  })

  console.log('schemas', schemaTablePairs)

  const supercopyOperations = schemaTablePairs.map(([schema, table]) => {
    let csvPath = path.resolve(dirs, schema)
    return supercopy(
      {
        sourceDir: path.resolve(csvPath, table),
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: schema,
        truncateTables: true,
        debug: true
      }
    )
  })
  Promise.all(supercopyOperations)
    .then(() => {
      callback(null)
    })
    .catch(err => {
      callback(err)
    })
}

function getDirs (dirs) {
  return fs.readdirSync(dirs).filter(file => fs.statSync(path.join(dirs, file)).isDirectory())
}
