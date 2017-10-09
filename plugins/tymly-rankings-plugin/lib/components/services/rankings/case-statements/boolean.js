'use strict'

const _ = require('lodash')

module.exports = function boolean (factorName, factorObj, schema, table, column) {
  return `CASE ` +
    `WHEN (SELECT COUNT(*) FROM ${schema}.${table} where ${column} = g.${column}) > 0 ` +
    `THEN ${factorObj['true-score']} ` +
    `ELSE ${factorObj['false-score']} ` +
    `END AS ${_.snakeCase(factorName)}_score`
}
