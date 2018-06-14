/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')

function roundToSixDp (num) {
  return +(num.toFixed(7).slice(0, -1))
}

describe('growth curve validation', () => {
  const factors = [
    {
      score: 146,
      exp: -0.00088,
      expected: [
        [ 0, 1.780487 ],
        [ 1, 1.782036 ],
        [ 2, 1.783585 ],
        [ 10, 1.796031 ],
        [ 50, 1.859558 ],
        [ 365, 2.443615 ],
        [ 600, 2.993493 ]
      ]
    },
    {
      score: 146,
      exp: -0.0025,
      expected: [
        [ 0, 1.780487 ],
        [ 1, 1.784890 ],
        [ 2, 1.789303 ],
        [ 10, 1.824997 ],
        [ 50, 2.014286 ],
        [ 365, 4.355211 ],
        [ 600, 7.654582 ],
        [ 2000, 94.451082 ],
        [ 2400, 121.587743 ],
        [ 10000, 145.999999 ]
      ]
    }
  ]

  for (const { score, exp, expected } of factors) {
    describe(`RIDGE score of ${score} with ${exp} exponent`, () => {
      for (const [days, target] of expected) {
        it(`${days} days elapsed`, () => {
          const curve = calculateGrowthCurve(
            exp,
            days,
            score
          )

          expect(
            roundToSixDp(curve)
          )
            .to.be.eql(target)
        })
      } // for ...
    }) // describe ...
  } // for ...
})

function dayOnCurve (maxScore, tempScore, exp) {
  const scoreRatio = maxScore / tempScore
  const adjustedRatio = (scoreRatio - 1) / 81

  const logRatio = Math.log(adjustedRatio)

  const days = logRatio / exp

  return Math.floor(days)
} // dayOnCurve

describe('score adjustment', () => {
  const regressionCurves = [
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

  for (const curves of regressionCurves) {
    const {
      maxScore,
      meanRisk,
      highRiskThreshold,
      exp,
      expectedDays
    } = curves

    it(`${meanRisk} to ${highRiskThreshold} with exp = ${exp} takes ${expectedDays} days`, () => {
      const baseline = dayOnCurve(maxScore, meanRisk, exp)
      const target = dayOnCurve(maxScore, highRiskThreshold, exp)

      const daysElapsed = target - baseline

      expect(daysElapsed).to.equal(expectedDays)
    })
  }

  for (const curves of regressionCurves) {
    const {
      maxScore: assessedScore,
      meanRisk: temporaryScore,
      highRiskThreshold: expectedScore,
      exp,
      expectedDays: elapsedDays
    } = curves

    it(`${temporaryScore} with exp = ${exp} after ${elapsedDays} days is ${expectedScore}`, () => {
      const dayOffset = dayOnCurve(assessedScore, temporaryScore, exp)

      const effectiveDaysElapsed = elapsedDays + dayOffset

      const modifiedScore = calculateGrowthCurve(exp, effectiveDaysElapsed, assessedScore)

      expect(Math.round(modifiedScore)).to.equal(expectedScore)
    })
  }
})
