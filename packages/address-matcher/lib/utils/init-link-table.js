'use strict'

function initLinkTable (options, client, callback) {
  client.query(
    generateStatement(options),
    function (err) {
      if (err) console.error(err)
      callback(err)
    }
  )
}

function generateStatement (options) {
  return `CREATE SCHEMA IF NOT EXISTS ${options.link.schema};` +
    `DROP TABLE IF EXISTS ${options.link.schema}.${options.link.table};` +
    `CREATE TABLE ${options.link.schema}.${options.link.table} (` +
    `${options.source.id} ${options.source.type} NOT NULL PRIMARY KEY, ` +
    `${options.target.id} ${options.target.type},` +
    `match_certainty integer);`
}

module.exports = initLinkTable
initLinkTable.generateStatement = generateStatement
