'use strict'
const temporaryRiskScore = require('./temporary-risk-score')
const growthCurveIntersection = require('./growth-curve-intersection')
const calculateGrowthCurve = require('./calculate-growth-curve')

module.exports = function calculateNewRiskScore (riskScore, range, daysElapsed, mean, stdev, exp) {
  const tempScore = temporaryRiskScore(range, riskScore, mean, stdev)

  const offset = growthCurveIntersection(riskScore, tempScore, exp)

  const effectiveDays = daysElapsed + offset
  const crs = calculateGrowthCurve(exp, effectiveDays, riskScore)

  return crs
} // calculateNewRiskScore
