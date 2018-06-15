/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')
const growthCurveIntersection = require('./../lib/components/services/rankings/growth-curve-intersection')

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
