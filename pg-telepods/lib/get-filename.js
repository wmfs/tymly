'use strict'
const _ = require('lodash')

module.exports = function getFilename (fullTableName) {
  const parts = fullTableName.split('.')
  let tableName = parts[parts.length - 1]
  tableName = _.kebabCase(tableName) + '.csv'
  return tableName
}
