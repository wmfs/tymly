'use strict'
const debug = require('debug')('tymly-rankings-plugin')

module.exports = function calculateNewRiskScore (range, riskScore, growthCurve, mean, stdev) {
  debug(`Calculating new risk score based on growth curve and range`)
  let value
  switch (range) {
    case 'veryHigh':
    case 'high':
      debug(`((${mean} + ${stdev}) / 2) + ${growthCurve}`)
      value = ((mean + stdev) / 2) + growthCurve
      break
    case 'medium':
    case 'low':
    case 'veryLow':
      debug(`(${riskScore} / 2) + ${growthCurve}`)
      value = (riskScore / 2) + growthCurve
      break
  }

  if (value < riskScore) return +value.toFixed(2)
  else return riskScore
}
