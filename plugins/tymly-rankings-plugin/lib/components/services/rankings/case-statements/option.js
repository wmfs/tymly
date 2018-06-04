'use strict'

const _ = require('lodash')

module.exports = function options (factorName, factorObj, schema, table, column) {
  let statement = `CASE `
  let cast = ``
  _.forEach(factorObj.options, function (i) {
    if (i.type === 'text-constant') {
      statement += `WHEN upper(${table}.${column}) = upper('${i.textualValue}') THEN ${i.score} `
      cast = `::int`
    } else if (i.type === 'numeric-constant') {
      cast = `::int`
      statement += `WHEN ${table}.${column}${cast} = ${i.numericValue} THEN ${i.score} `
    } else if (i.type === 'numeric-range') {
      cast = `::int`
      statement += `WHEN ${table}.${column}${cast} BETWEEN ${i.minimum} AND ${i.maximum} THEN ${i.score} `
    } else if (i.type === 'numeric-boundary') {
      cast = `::int`
      if (i.operator === 'greaterThan') {
        statement += `WHEN ${table}.${column}${cast} > ${i.numericValue} THEN ${i.score} `
      } else if (i.operator === 'lessThan') {
        statement += `WHEN ${table}.${column}${cast} < ${i.numericValue} THEN ${i.score} `
      }
    } else if (i.type === 'boolean-equals') {
      cast = `::boolean`
      statement += `WHEN ${table}.${column}${cast} = ${i.booleanValue} THEN ${i.score} `
    }
  })
  statement += `ELSE ${factorObj.default} END AS ${_.snakeCase(factorName)}_score`
  return statement
}
