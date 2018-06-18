'use strict'
const moment = require('moment')
const temporaryRiskScore = require('./temporary-risk-score')
const growthCurveIntersection = require('./growth-curve-intersection')

module.exports = function projectedRecoveryDates (riskScore, range, ranges, daysElapsed, mean, stdev, exp) {
  const tempScore = temporaryRiskScore(range, riskScore, mean, stdev)
  const offset = growthCurveIntersection(riskScore, tempScore, exp)
  const effectiveDays = daysElapsed + offset

  const projectedHighRiskDate = effectiveDate(riskScore, ranges.veryHigh.lowerBound, exp, effectiveDays)
  const projectedReturnDate = effectiveDate(riskScore, riskScore-1, exp, effectiveDays)

  return {
    projectedHighRiskDate,
    projectedReturnDate
  }
} // projectedRecoveryDates

function effectiveDate (riskScore, targetScore, exp, elapsedDays) {
  if (targetScore > riskScore) {
    return null
  }

  const offset = growthCurveIntersection(riskScore, targetScore, exp)

  const daysUntil = offset - elapsedDays

  return moment().add(daysUntil, "days")
} // effectiveDate
