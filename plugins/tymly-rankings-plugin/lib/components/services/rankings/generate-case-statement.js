'use strict'

const exists = require('./case-statements/exists')
const constant = require('./case-statements/constant')
const option = require('./case-statements/option')

module.exports = function generateCaseStatement (options) {
  if (options.factorObj.type === 'constant') {
    return constant(options.factorName, options.factorObj)
  } else if (options.factorObj.type === 'options') {
    return option(options.factorName, options.factorObj, options.schema, options.table, options.column)
  } else if (options.factorObj.type === 'exists') {
    return exists(options.factorName, options.factorObj, options.schema, options.table, options.column)
  }
}
