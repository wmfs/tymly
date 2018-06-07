'use strict'

const QueryStream = require('pg-query-stream')
const UpsertTransformer = require('./Upsert-transformer')
const fs = require('fs')
const path = require('path')
const getFilename = require('./get-filename')
const promisify = require('util').promisify

module.exports = promisify(processUpserts)

function processUpserts (options, callback) {
  const upsertsFilePath = path.join(options.upsertsDir, getFilename(options.target.tableName))

  const sourceHashColumnName = options.source.hashSumColumnName
  const targetHashColumnName = options.target.hashSumColumnName
  const joinCondition = Object.entries(options.join)
    .map(([targetColumnName, sourceColumnName]) => `source.${sourceColumnName} = target.${targetColumnName}`)

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
