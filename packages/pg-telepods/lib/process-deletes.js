'use strict'
const path = require('path')
const _ = require('lodash')
const getFilename = require('./get-filename')
const pgcopy = require('pg-copy-streams').to
const fs = require('fs')

module.exports = function processDeletes (options, callback) {
  // Query delete and write to a file
  const deleteFilepath = path.join(options.deletesDir, getFilename(options.target.tableName))
  const sourcePk = _.keys(options.join).join(', ')
  const targetPk = _.values(options.join).join(', ')

  const sql = `copy (` +
    `select ${targetPk} from ${options.target.tableName} ` +
    `where (${targetPk}) not in (select ${sourcePk} from ${options.source.tableName})) ` +
    `to stdout with csv delimiter ',' header encoding 'UTF8';`
  const outstream = options.client.query(
    pgcopy(sql)
  )
  const output = fs.createWriteStream(deleteFilepath)
  output.on('error', callback)
  outstream.pipe(output)
  outstream.on('end', callback)
  outstream.on('error', callback)
}
