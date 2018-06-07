'use strict'

const supercopy = require('supercopy')
const promisify = require('util').promisify

module.exports = promisify(processCopy)

function processCopy (options, callback) {
  const tableNameParts = options.target.tableName.split('.')
  supercopy(
    {
      sourceDir: options.outputDir,
      headerColumnNamePkPrefix: '.',
      topDownTableOrder: [tableNameParts[1]],
      client: options.client,
      schemaName: tableNameParts[0],
      debug: false
    },
    callback
  )
}
