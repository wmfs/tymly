'use strict'

const _ = require('lodash')

module.exports = function constant (factorName, factorObj) {
  return `${factorObj.score} as ${_.snakeCase(factorName)}_score`
}
