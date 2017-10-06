'use strict'

module.exports = function generateJoinStatement (factorObj, schema, table, columnToMatchOn) {
  if (factorObj.type !== 'constant') {
    return `LEFT JOIN ${schema}.${table} ${table} ON ${table}.${columnToMatchOn} = g.${columnToMatchOn} `
  } else {
    return ``
  }
}
