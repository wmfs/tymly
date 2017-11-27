'use strict'

const initMatchTable = require('./utils/init-match-table.js')
const matchPostcodeAndName = require('./utils/match-postcode-and-name.js')
const insertUnmatchedRecords = require('./utils/insert-unmatched-records.js')

function matchTables (options, client, callback) {
  const statistics = {}

  initMatchTable(options, client, (err) => {
    if (err) callback(err)

    matchPostcodeAndName(options, client, (err) => {
      if (err) callback(err)

      insertUnmatchedRecords(options, client, (err) => {
        if (err) callback(err)

        // How many have not been matched?
        client.query(
          `select count(*) from ${options.match.schema}.${options.match.table} where match_certainty = 0`,
          (err, unmatchedRows) => {
            if (err) callback(err)
            statistics.unmatched = unmatchedRows.rows[0].count
            client.query(
              `select count(*) from ${options.match.schema}.${options.match.table}`,
              (err, sourceRows) => {
                statistics.total = sourceRows.rows[0].count
                statistics.accuracy = Math.round(((statistics.total - statistics.unmatched) / statistics.total) * 100)
                console.log('Total: ' + statistics.total)
                console.log('Matched: ' + (statistics.total - statistics.unmatched))
                console.log('Accuracy: ' + statistics.accuracy + '%')
                callback(err)
              }
            )
          }
        )
      })
    })
  })
}

module.exports = matchTables
