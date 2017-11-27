'use strict'

const initLinkTable = require('./utils/init-link-table.js')
const matchPostcodeAndName = require('./utils/match-postcode-and-name.js')
const insertUnmatchedRecords = require('./utils/insert-unmatched-records.js')

function linkTables (options, client, callback) {
  initLinkTable(options, client, (err) => {
    if (err) callback(err)

    matchPostcodeAndName(options, client, (err) => {
      if (err) callback(err)

      insertUnmatchedRecords(options, client, (err) => {
        if (err) callback(err)

        // How many have not been matched?
        client.query(
          `select count(*) from ${options.link.schema}.${options.link.table} where match_certainty = 0`,
          (err, sourceRows) => {
            console.log(sourceRows.rows[0].count + ' not matched.')
            callback(err)
          }
        )
      })
    })
  })
}

module.exports = linkTables
