'use strict'

// const debug = require('debug')('flobot-pg-plugin')
const _ = require('lodash')

module.exports = function generateUpsertStatement (model, object) {
  const columnCount = object.propertyNames.length
  const rowCount = object.data.length

  let statement = `INSERT INTO ${object.namespace}.${_.snakeCase(object.name)} (${object.propertyNames.join(', ')}) VALUES `
  for (let row = 1; row <= rowCount; row++) {
    let valueLine = '('
    for (let col = 1; col <= columnCount; col++) {
      valueLine += '$' + (col + ((row - 1) * columnCount))

      if (col < columnCount) {
        valueLine += ', '
      }
    }
    valueLine += ')'

    if (row < rowCount) {
      valueLine += ', '
    }

    statement += valueLine
  }

  statement += ` ON CONFLICT (${model.pkColumnNames.join((', '))}) DO NOTHING;`

  return statement
}
