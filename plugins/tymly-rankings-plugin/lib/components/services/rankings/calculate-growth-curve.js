'use strict'
const debug = require('debug')('tymly-rankings-plugin')

module.exports = function calculateGrowthCurve (exp, daysSince, riskScore) {
  const expression = Math.exp(exp * daysSince)
  const denominator = 1 + (81 * expression)

  debug(`Calculating growth curve: ${riskScore} / ( 1 + ( 81 * ( e ^ ( ${daysSince} * ${exp} ) ) ) ) = ${riskScore / denominator}`)

  return riskScore / denominator
}
