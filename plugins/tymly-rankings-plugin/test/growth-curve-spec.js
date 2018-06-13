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

function day_on_curve(max_score, temp_score, exp) {
  const score_ratio = max_score/temp_score
  const adjusted_ratio = (score_ratio - 1)/81

  const log_ratio = Math.log(adjusted_ratio)

  const days = log_ratio / exp

  return Math.floor(days)
} // start_day_om_curve

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
      const baseline = day_on_curve(max_score, mean_risk, exp)
      const target = day_on_curve(max_score, high_risk_threshold, exp)

      const days_elapsed = target - baseline

      expect(days_elapsed).to.equal(expected_days)
    })
  }

  for (const curves of regression_curves) {
    const {
      max_score: assessed_score,
      mean_risk: temporary_score,
      high_risk_threshold: expected_score,
      exp,
      expected_days: elapsed_days
    } = curves

    it(`${temporary_score} with exp = ${exp} after ${elapsed_days} days is ${expected_score}`, () => {
      const day_offset = day_on_curve(assessed_score, temporary_score, exp)

      const effective_days_elapsed = elapsed_days + day_offset

      const modified_score = calculateGrowthCurve(exp, effective_days_elapsed, assessed_score)

      expect(Math.round(modified_score)).to.equal(expected_score)
    })
  }
})

