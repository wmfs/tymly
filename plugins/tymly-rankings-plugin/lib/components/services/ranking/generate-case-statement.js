'use strict'

const boolean = require('./case-statements/boolean')
const constant = require('./case-statements/constant')
const numeric = require('./case-statements/numeric')
const options = require('./case-statements/options')

module.exports = function generateCaseStatement (factorName, factorObj, schema, table, column) {
  if (factorObj.type === 'numerical') {
    return numeric(factorName, factorObj, schema, table, column)
  } else if (factorObj.type === 'options') {
    return options(factorName, factorObj, schema, table, column)
  } else if (factorObj.type === 'boolean') {
    return boolean(factorName, factorObj, schema, table, column)
  } else if (factorObj.type === 'constant') {
    return constant(factorName, factorObj, schema, table, column)
  }
}
