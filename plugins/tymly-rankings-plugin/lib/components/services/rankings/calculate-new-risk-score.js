'use strict'

module.exports = function calculateNewRiskScore (range, riskScore, growthCurve, mean, stdev) {
  let value
  switch (range) {
    case 'veryHigh':
    case 'high':
      value = ((+mean + +stdev) / 2) + +growthCurve
      break
    case 'medium':
    case 'low':
    case 'veryLow':
      value = (+riskScore / 2) + +growthCurve
      break
  }

  if (value < riskScore) return value.toFixed(2)
  else return riskScore
}
