'use strict'

const async = require('async')
const fs = require('fs')
const QueryStream = require('pg-query-stream')
const Transformer = require('./Transformer')

module.exports = function generateDelta (options, callback) {
  const deltaFileWriteStream = fs.createWriteStream(options.outputFilepath, {defaultEncoding: 'utf8'})
  const info = {
    totalCount: 0
  }
  async.each(
    options.tables,
    function (table, cb) {
      const sql = `select * from ${table.tableName} where ${options.modifiedColumnName} >= $1`
      const dbStream = options.client.query(new QueryStream(sql, [options.since]))

      dbStream.on('end', function closeDatabaseStream () {
        cb(null)
      })

      const csvTransformer = new Transformer(info, table, options)
      dbStream.pipe(csvTransformer).pipe(deltaFileWriteStream)
    },
    function (err) {
      if (err) {
        deltaFileWriteStream.end()
        callback(err)
      } else {
        deltaFileWriteStream.end()
        callback(null, info)
      }
    }
  )
}
