'use strict'

const exists = require('./case-statements/exists')
const constant = require('./case-statements/constant')
const option = require('./case-statements/option')

function checkFactorObj (options) {
  if (!options.factorObj) {
    throw new Error(`Rankings misconfiguration for ${options.factorName} - Missing factorObj - check the registry`)
  }
}

function checkOptions (options) {
  if (!options.schema || !options.table || !options.column) {
    throw new Error(`Rankings misconfiguration for ${options.factorName} - schema/table/column missing, possible rankings and registry mismatch.  `)
  }
}

module.exports = function generateCaseStatement (options) {
  checkFactorObj(options)

  if (options.factorObj.type === 'constant') {
    return constant(options.factorName, options.factorObj)
  } else if (options.factorObj.type === 'options') {
    checkOptions(options)
    return option(options.factorName, options.factorObj, options.schema, options.table, options.column)
  } else if (options.factorObj.type === 'exists') {
    checkOptions(options)
    return exists(options.factorName, options.factorObj, options.schema, options.table, options.column)
  }
}
