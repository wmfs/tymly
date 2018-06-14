const debug = require('debug')('tymly-rankings-plugin')

function calculateGrowthCurve (exp, daysElapsed, riskScore) {
  const exponential = Math.exp(exp * daysElapsed)
  const denominator = 1 + (81 * exponential)
  const curveValue = riskScore / denominator

  debug(`Calculating growth curve: ${riskScore} / ( 1 + ( 81 * ( e ^ ( ${daysElapsed} * ${exp} ) ) ) ) = ${curveValue}`)

  return curveValue
} // calculateGrowthCurve

module.exports = calculateGrowthCurve

