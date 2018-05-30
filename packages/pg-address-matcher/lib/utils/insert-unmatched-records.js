'use strict'

module.exports = function insertUnmatchedRecords (options, client) {
  return new Promise((resolve, reject) => {
    client.query(
      generateStatement(options),
      err => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

function generateStatement (options) {
  return `INSERT INTO ${options.match.schema}.${options.match.table} (${options.source.id}, match_certainty) ` +
    `SELECT ${options.source.id}, 0 ` +
    `FROM ${options.source.schema}.${options.source.table} ` +
    `ON CONFLICT (${options.source.id}) do nothing;`
}
