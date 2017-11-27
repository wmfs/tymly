'use strict'

function initmatchTable (options, client, callback) {
  client.query(
    generateStatement(options) + generateCertaintyReferenceTable(options),
    function (err) {
      if (err) console.error(err)
      callback(err)
    }
  )
}

function generateStatement (options) {
  return `CREATE SCHEMA IF NOT EXISTS ${options.match.schema}; ` +
    `DROP TABLE IF EXISTS ${options.match.schema}.${options.match.table}; ` +
    `CREATE TABLE ${options.match.schema}.${options.match.table} (` +
    `${options.source.id} ${options.source.type} NOT NULL PRIMARY KEY, ` +
    `${options.target.id} ${options.target.type}, ` +
    `match_certainty integer); `
}

function generateCertaintyReferenceTable (options) {
  return `CREATE TABLE IF NOT EXISTS ${options.match.schema}.certainty_reference ` +
    `(match_certainty integer NOT NULL PRIMARY KEY, description text); ` +
    `INSERT INTO ${options.match.schema}.certainty_reference ` +
    `(match_certainty, description) VALUES ` +
    `(0, 'Not matched.'), ` +
    `(1, 'Manually matched.'), ` +
    `(2, 'Exact match on postcode and name.'), ` +
    `(3, 'Fuzzy match on postcode and name.')
    ON CONFLICT (match_certainty) DO NOTHING; `
}

module.exports = initmatchTable
initmatchTable.generateStatement = generateStatement
