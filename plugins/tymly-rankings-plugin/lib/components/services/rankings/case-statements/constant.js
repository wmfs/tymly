'use strict'

const _ = require('lodash')

module.exports = function constant (factorName, factorObj) {
  return `${factorObj.value} as ${_.snakeCase(factorName)}_score`
}
