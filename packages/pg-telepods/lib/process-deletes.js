'use strict'
const debug = require('debug')('telepods')
const path = require('path')
const getFilename = require('./get-filename')
const pgcopy = require('pg-copy-streams').to
const fs = require('fs')
const promisify = require('util').promisify

module.exports = promisify(processDeletes)

function processDeletes (options, callback) {
  // Query delete and write to a file
  const deleteFilepath = path.join(options.deletesDir, getFilename(options.target.tableName))

  const sourcePk = Object.keys(options.join).join(', ')
  const targetPk = Object.values(options.join).join(', ')

  const deleteSql = `select ${targetPk} from ${options.target.tableName} ` +
    `  except ` +
    `  select ${sourcePk} from ${options.source.tableName} `

  debug(deleteSql)

  const sql = `copy (${deleteSql}) ` +
    `to stdout with csv delimiter ',' header encoding 'UTF8';`

  const output = fs.createWriteStream(deleteFilepath)
  const pipeToOutput = (sql, params, client) => {
    output.on('error', callback)

    const queryStream = client.query(pgcopy(sql))

    queryStream.pipe(output)

    queryStream.on('end', callback)
    queryStream.on('error', callback)
  }

  options.client.run([
    { sql: sql, action: pipeToOutput }
  ])
}
