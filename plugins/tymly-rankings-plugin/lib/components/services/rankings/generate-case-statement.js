'use strict'

const boolean = require('./case-statements/boolean')
const constant = require('./case-statements/constant')
const option = require('./case-statements/option')

module.exports = function generateCaseStatement (options) {
  if (options.factorObj.type === 'constant') {
    return constant(options.factorName, options.factorObj)
  } else if (options.factorObj.type === 'options') {
    return option(options.factorName, options.factorObj, options.schema, options.table, options.column)
  } else if (options.factorObj.type === 'boolean') {
    return boolean(options.factorName, options.factorObj, options.schema, options.table, options.column)
  }
}
