'use strict'

const supercopy = require('supercopy')
const fs = require('fs')
const path = require('path')
const pg = require('pg')

let connectionString = process.env.PG_CONNECTION_STRING
let client = new pg.Client(connectionString)

exports.refresh = function (dirs, callback) {
  let schemas = getDirs(dirs)
  client.connect()

  const schemaTablePairs = []

  schemas.forEach(schema => {
    console.log('schema: ', schema)
    let tables = getDirs(path.resolve(dirs, schema))
    console.log('tables: ', tables)
    tables.forEach(table => schemaTablePairs.push([schema, table]))
  })

  console.log('schemas', schemaTablePairs)

  const supercopyOperations = schemaTablePairs.map(([schema, table]) => {
    let csvPath = path.resolve(dirs, schema)
    console.log('schema path: ', path.resolve(csvPath, table))
    return supercopy(
      {
        sourceDir: path.resolve(csvPath, table),
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: schema,
        truncateTables: true,
        debug: false
      }
    )
  })

  Promise.all(supercopyOperations)
    .then(() => callback(null))
    .catch(err => callback(err))
}

function getDirs (dirs) {
  return fs.readdirSync(dirs).filter(file => fs.statSync(path.join(dirs, file)).isDirectory())
}
