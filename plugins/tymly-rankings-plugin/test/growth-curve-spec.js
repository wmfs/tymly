/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')

function roundToSixDp (num) {
  return +(num.toFixed(7).slice(0,-1))
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
        [ 600, 2.993493 ],
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

function* curve_generator(max_score, exp, start_days = 0) {
  let now = calculateGrowthCurve(exp, start_days, max_score)
  for (let days_elapsed = start_days; ++days_elapsed; ) {
    let next = calculateGrowthCurve(exp, days_elapsed+1, max_score)
    yield [
      days_elapsed,
      now,
      next
    ]
    now = next
  }
} // curve_generator

function count_days_to(curve, target_score) {
  for (const [days, lower, upper] of curve) {
    if ((lower <= target_score) && (upper > target_score))
      return days
  }
} // count_days_to

describe('score adjustment', () => {
  const regression_curves = [
    {
      max_score: 146,
      mean_risk: 79,
      high_risk_threshold: 98,
      exp: -0.0025,
      expected_days: 220
    },
    {
      max_score: 146,
      mean_risk: 79,
      high_risk_threshold: 98,
      exp: -0.0004,
      expected_days: 1372 // spreadsheet caption says 1432 and 1171 but they're both wrong - if you examine the figures it is 1372
    },
    {
      max_score: 146,
      mean_risk: 79,
      high_risk_threshold: 98,
      exp: -0.00088,
      expected_days: 624 // spreadsheet caption says 532, but checking the figures gives 624
    }
  ]

  for (const curves of regression_curves) {
    const {
      max_score,
      mean_risk,
      high_risk_threshold,
      exp,
      expected_days
    } = curves

    it(`${mean_risk} to ${high_risk_threshold} with exp = ${exp} takes ${expected_days} days`, () => {
      const baseline = count_days_to(curve_generator(max_score, exp), mean_risk)
      const target = count_days_to(curve_generator(max_score, exp, baseline), high_risk_threshold)

      const days_elapsed = target - baseline

      expect(days_elapsed).to.equal(expected_days)
    })
  }
})