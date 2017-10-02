'use strict'

// const debug = require('debug')('tymly-pg-plugin')

// generates a postgres SQL INSERT statement that looks something like...
//    INSERT INTO schema.table_name (column1, column2)
//    VALUES ($1, $2), ($3, $4), ($5, $6)
//    ON CONFLICT (id) DO NOTHING;
module.exports = function generateUpsertStatement (model, object) {
  const columnCount = object.propertyNames.length
  const rowCount = object.data.length

  let statement = `INSERT INTO ${model.fullTableName} (${object.propertyNames.join(', ')}) VALUES `
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
