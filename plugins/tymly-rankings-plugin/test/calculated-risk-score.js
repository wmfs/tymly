/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')
const growthCurveIntersection = require('./../lib/components/services/rankings/growth-curve-intersection')

describe('calculated risk score', () => {
  const growthCurves = [
    {
      maxScore: 146,
      meanRisk: 79,
      highRiskThreshold: 98,
      exp: -0.0025,
      expectedDays: 220
    },
    {
      maxScore: 146,
      meanRisk: 79,
      highRiskThreshold: 98,
      exp: -0.0004,
      expectedDays: 1372 // spreadsheet caption says 1432 and 1171 but they're both wrong - if you examine the figures it is 1372
    },
    {
      maxScore: 146,
      meanRisk: 79,
      highRiskThreshold: 98,
      exp: -0.00088,
      expectedDays: 624 // spreadsheet caption says 532, but checking the figures gives 624
    }
  ]

  for (const curves of growthCurves) {
    const {
      maxScore,
      meanRisk,
      highRiskThreshold,
      exp,
      expectedDays
    } = curves

    it(`${meanRisk} to ${highRiskThreshold} with exp = ${exp} takes ${expectedDays} days`, () => {
      const baseline = growthCurveIntersection(maxScore, meanRisk, exp)
      const target = growthCurveIntersection(maxScore, highRiskThreshold, exp)

      const daysElapsed = target - baseline

      expect(daysElapsed).to.equal(expectedDays)
    })
  }

  for (const curves of growthCurves) {
    const {
      maxScore: assessedScore,
      meanRisk: temporaryScore,
      highRiskThreshold: expectedScore,
      exp,
      expectedDays: elapsedDays
    } = curves

    it(`TRS of ${temporaryScore} with exp = ${exp} after ${elapsedDays} days is ${expectedScore}`, () => {
      const dayOffset = growthCurveIntersection(assessedScore, temporaryScore, exp)

      const effectiveDaysElapsed = elapsedDays + dayOffset

      const modifiedScore = calculateGrowthCurve(exp, effectiveDaysElapsed, assessedScore)

      expect(Math.round(modifiedScore)).to.equal(expectedScore)
    })
  }
})
