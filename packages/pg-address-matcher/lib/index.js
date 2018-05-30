'use strict'

const initMatchTable = require('./utils/init-match-table.js')
const matchPostcodeAndName = require('./utils/match-postcode-and-name.js')
const insertUnmatchedRecords = require('./utils/insert-unmatched-records.js')

async function matchTables (options, client) {
  const statistics = {}

  await initMatchTable(options, client)
  await matchPostcodeAndName(options, client)
  await insertUnmatchedRecords(options, client)

  // How many have not been matched?
  const unmatchedRows = await client.query(`select count(*) from ${options.match.schema}.${options.match.table} where match_certainty = 0`)
  statistics.unmatched = unmatchedRows.rows[0].count

  // How many records in total?
  const sourceRows = await client.query(`select count(*) from ${options.match.schema}.${options.match.table}`)
  statistics.total = sourceRows.rows[0].count
  statistics.accuracy = Math.round(((statistics.total - statistics.unmatched) / statistics.total) * 100)
  console.log('Total: ' + statistics.total)
  console.log('Matched: ' + (statistics.total - statistics.unmatched))
  console.log('Accuracy: ' + statistics.accuracy + '%')
}

module.exports = matchTables
