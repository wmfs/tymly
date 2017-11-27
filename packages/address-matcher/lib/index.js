'use strict'

const initLinkTable = require('./utils/init-link-table.js')
const matchPostcodeAndName = require('./utils/match-postcode-and-name.js')

function linkTables (options, client, callback) {
  initLinkTable(options, client, (err) => {
    if (err) callback(err)

    matchPostcodeAndName(options, client, (err) => {
      if (err) callback(err)

      // How many have not been matched?
      client.query(
        `select count(*) from ${options.source.schema}.${options.source.table} where ${options.source.id} ` +
        `NOT IN (SELECT ${options.source.id} FROM ${options.link.schema}.${options.link.table})`,
        (err, sourceRows) => {
          console.log(sourceRows.rows[0].count + ' not matched.')
          callback(err)
        }
      )
    })
  })
}

module.exports = linkTables
