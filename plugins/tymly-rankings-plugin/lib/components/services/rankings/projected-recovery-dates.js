'use strict'
const moment = require('moment')
const temporaryRiskScore = require('./temporary-risk-score')
const growthCurveIntersection = require('./growth-curve-intersection')

module.exports = function projectedRecoveryDates (riskScore, range, ranges, daysElapsed, mean, stdev, exp, referenceDate) {
  const tempScore = temporaryRiskScore(range, riskScore, mean, stdev)
  const offset = growthCurveIntersection(riskScore, tempScore, exp)
  const effectiveDays = daysElapsed + offset

  const projectedHighRiskDate = effectiveDate(riskScore, ranges.veryHigh.lowerBound, exp, effectiveDays, referenceDate)
  const projectedReturnDate = effectiveDate(riskScore, riskScore - 1, exp, effectiveDays, referenceDate)

  return {
    projectedHighRiskDate,
    projectedReturnDate
  }
} // projectedRecoveryDates

function effectiveDate (riskScore, targetScore, exp, elapsedDays, referenceDate) {
  if (targetScore > riskScore) {
    return null
  }

  const offset = growthCurveIntersection(riskScore, targetScore, exp)

  const daysUntil = offset - elapsedDays

  return moment(referenceDate).add(daysUntil, 'days')
} // effectiveDate
