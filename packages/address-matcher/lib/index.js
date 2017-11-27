'use strict'

const initmatchTable = require('./utils/init-match-table.js')
const matchPostcodeAndName = require('./utils/match-postcode-and-name.js')
const insertUnmatchedRecords = require('./utils/insert-unmatched-records.js')

function matchTables (options, client, callback) {
  initmatchTable(options, client, (err) => {
    if (err) callback(err)

    matchPostcodeAndName(options, client, (err) => {
      if (err) callback(err)

      insertUnmatchedRecords(options, client, (err) => {
        if (err) callback(err)

        // How many have not been matched?
        client.query(
          `select count(*) from ${options.match.schema}.${options.match.table} where match_certainty = 0`,
          (err, sourceRows) => {
            console.log(sourceRows.rows[0].count + ' not matched.')
            callback(err)
          }
        )
      })
    })
  })
}

module.exports = matchTables
