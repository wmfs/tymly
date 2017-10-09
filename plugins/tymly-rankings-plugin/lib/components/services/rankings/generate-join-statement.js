'use strict'

module.exports = function generateJoinStatement (options) {
  if (options.factorObj.type !== 'constant') {
    return `LEFT JOIN ${options.schema}.${options.table} ${options.table} ` +
      `ON ${options.table}.${options.columnToMatch} = g.${options.columnToMatch} `
  } else {
    return ``
  }
}
