'use strict'

const _ = require('lodash')

module.exports = function pgConcat (parts) {
  let statementParts = []
  let statement

  if (parts === undefined) {
    statement = undefined
  } else {
    parts.forEach(function (part) {
      console.log(' -- Part:', part)
      if (part.hasOwnProperty('columnName')) {
        if (part.hasOwnProperty('default')) {
          if (_.isString(part.default)) {
            statementParts.push(`COALESCE(${part.columnName}, '${part.default}')`)
          } else if (_.isNumber(part.default)) {
            statementParts.push(`COALESCE(${part.columnName}, ${part.default})`)
          }
        } else {
          statementParts.push(`${part.columnName}`)
        }
      } else {
        statementParts.push(`'${part}'`)
      }
    })
    statement = statementParts.join('||')
  }

  console.log('Statement: ' + statement)
  return statement
}
