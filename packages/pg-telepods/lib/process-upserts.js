'use strict'

const _ = require('lodash')
const QueryStream = require('pg-query-stream')
const UpsertTransformer = require('./Upsert-transformer')
const fs = require('fs')
const path = require('path')
const getFilename = require('./get-filename')

module.exports = function processUpserts (options, callback) {
  const upsertsFilePath = path.join(options.upsertsDir, getFilename(options.target.tableName))
  const sourceHashColumnName = options.source.hashSumColumnName
  const targetHashColumnName = options.target.hashSumColumnName
  let joinCondition = []
  _.forEach(options.join, function (targetColumnName, sourceColumnName) {
    joinCondition.push(`source.${sourceColumnName} = target.${targetColumnName}`)
  })
  const sql = `select source.*, target.${targetHashColumnName} _target_hash_sum from ${options.source.tableName} source ` +
    `left outer join ${options.target.tableName} target on (${joinCondition.join(' AND ')}) ` +
    `where target.${targetHashColumnName} is null ` +
    `or (target.${targetHashColumnName} is not null and source.${sourceHashColumnName} != target.${targetHashColumnName});`

  const upsertWriteFileStream = fs.createWriteStream(upsertsFilePath)
  const upsertTransform = (sql, params, client) => {
    const stream = client.query(new QueryStream(sql))

    stream.on('end', function () {
      upsertWriteFileStream.end()
      callback(null)
    })
    const upsertTransformer = new UpsertTransformer(options)
    stream.pipe(upsertTransformer).pipe(upsertWriteFileStream)
  } // upsertTransform

  options.client.run([
    { sql: sql, action: upsertTransform }
  ])
}
