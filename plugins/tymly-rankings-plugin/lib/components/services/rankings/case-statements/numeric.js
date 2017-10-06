'use strict'

const _ = require('lodash')

module.exports = function numeric (factorName, factorObj, schema, table, column) {
  let statement = `CASE `
  let cast = ''
  _.forEach(factorObj.ranges, function (i) {
    if (i.hasOwnProperty('option')) {
      statement += `WHEN upper(${table}.${column}) = upper('${i.option}') THEN 0 `
      cast = '::int'
    } else if (i.hasOwnProperty('minimum') && i.hasOwnProperty('maximum')) {
      statement += `WHEN ${table}.${column}${cast} BETWEEN ${i.minimum} AND ${i.maximum} THEN ${i.score} `
    } else if (i.hasOwnProperty('moreThan')) {
      statement += `WHEN ${table}.${column}${cast} > ${i.moreThan} THEN ${i.score} `
    } else if (i.hasOwnProperty('lessThan')) {
      statement += `WHEN ${table}.${column}${cast} < ${i.lessThan} THEN ${i.score} `
    } else if (i.hasOwnProperty('equals')) {
      statement += `WHEN ${table}.${column}${cast} = ${i.equals} THEN ${i.score} `
    }
  })
  statement += `ELSE 0 END AS ${_.snakeCase(factorName)}_score `

  return statement
}
