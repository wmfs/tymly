/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')

const RISK_SCORE = 146
const EXP_1 = -0.00088
const EXP_2 = -0.0004

describe('Tests the Ranking State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('should check the growth curve at 0 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 0, RISK_SCORE).toFixed(5)).to.eql(1.78049)
    expect(+calculateGrowthCurve(EXP_2, 0, RISK_SCORE).toFixed(5)).to.eql(1.78049)
  })

  it('should check the growth curve at 11117 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 11117, RISK_SCORE).toFixed(5)).to.eql(145.33599)
    expect(+calculateGrowthCurve(EXP_2, 11117, RISK_SCORE).toFixed(5)).to.eql(74.91037)
  })

  it('should check the growth curve at 13576 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 13576, RISK_SCORE).toFixed(5)).to.eql(145.92341)
    expect(+calculateGrowthCurve(EXP_2, 13576, RISK_SCORE).toFixed(5)).to.eql(107.75792)
  })
})
