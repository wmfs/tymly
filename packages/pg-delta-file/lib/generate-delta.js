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
  async.eachSeries(
    options.tables,
    function (table, cb) {
      const sql = `select * from ${table.tableName} where ${options.modifiedColumnName} >= $1`
      const csvTransform = (sql, values, client) => {
        const dbStream = client.query(new QueryStream(sql, values))
        dbStream.on('end', () => cb(null))

        const csvTransformer = new Transformer(info, table, options)
        dbStream.pipe(csvTransformer).pipe(deltaFileWriteStream, {end: false})
      }
      options.client.run([{sql: sql, params: [options.since], action: csvTransform}])
    },
    function (err) {
      deltaFileWriteStream.end()
      if (err) {
        callback(err)
      } else {
        callback(null, info)
      }
    }
  )
}
