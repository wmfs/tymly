'use strict'

const _ = require('lodash')

module.exports = function options (factorName, factorObj, schema, table, column) {
  let statement = `CASE `
  _.forEach(factorObj.ranges, function (i) {
    statement += `WHEN upper(${table}.${column}) = upper('${i.option}') THEN ${i.score} `
  })
  statement += `ELSE 0 END AS ${_.snakeCase(factorName)}_score `
  return statement
}
