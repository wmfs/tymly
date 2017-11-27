'use strict'

module.exports = function insertUnmatchedRecords (options, client, callback) {
  client.query(
    generateStatement(options),
    function (err) {
      if (err) console.error(err)
      callback(err)
    }
  )
}

function generateStatement (options) {
  return `INSERT INTO ${options.link.schema}.${options.link.table} (${options.source.id}, match_certainty) ` +
    `SELECT ${options.source.id}, 0 ` +
    `FROM ${options.source.schema}.${options.source.table} ` +
    `ON CONFLICT (${options.source.id}) do nothing;`
}
