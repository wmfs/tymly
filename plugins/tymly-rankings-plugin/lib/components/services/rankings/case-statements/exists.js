'use strict'

const _ = require('lodash')

module.exports = function exists (factorName, factorObj, schema, table, column) {
  return `CASE ` +
    `WHEN (SELECT COUNT(*) FROM ${schema}.${table} where ${column} = g.${column}) > 0 ` +
    `THEN ${factorObj.score} ` +
    `ELSE ${factorObj.default} ` +
    `END AS ${_.snakeCase(factorName)}_score`
}
