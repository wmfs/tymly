'use strict'
const path = require('path')
const _ = require('lodash')
const getFilename = require('./get-filename')

module.exports = function processDeletes (options, callback) {
  // Query delete and write to a file
  const deleteFilepath = path.join(options.deletesDir, getFilename(options.target.tableName))
  const sourcePk = _.keys(options.join).join(', ')
  const targetPk = _.values(options.join).join(', ')
  const sql = `copy (` +
    `select ${targetPk} from ${options.target.tableName} ` +
    `where (${targetPk}) not in (select ${sourcePk} from ${options.source.tableName})) ` +
    `to '${deleteFilepath}' with csv delimiter ',' header encoding 'UTF8';`
  options.client.query(
    sql,
    callback
  )
}
