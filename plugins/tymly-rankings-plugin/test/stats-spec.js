/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const calculateGrowthCurve = require('./../lib/components/services/rankings/calculate-growth-curve')
const calculateNewRiskScore = require('./../lib/components/services/rankings/calculate-new-risk-score')

const RISK_SCORE = 146
const EXP_1 = -0.00088
const EXP_2 = -0.0004

describe('Test the growth curve and updated risk score', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('At 0 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 0, RISK_SCORE).toFixed(5)).to.eql(1.78049)
    expect(+calculateGrowthCurve(EXP_2, 0, RISK_SCORE).toFixed(5)).to.eql(1.78049)

    expect(calculateNewRiskScore('veryLow', RISK_SCORE, 1.78049, 58.23, 31.45)).to.eql(74.78)
    expect(calculateNewRiskScore('veryHigh', RISK_SCORE, 1.78049, 58.23, 31.45)).to.eql(46.62)
  })

  it('At 11117 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 11117, RISK_SCORE).toFixed(5)).to.eql(145.33599)
    expect(+calculateGrowthCurve(EXP_2, 11117, RISK_SCORE).toFixed(5)).to.eql(74.91037)

    expect(calculateNewRiskScore('veryLow', RISK_SCORE, 145.33599, 58.23, 31.45)).to.eql(RISK_SCORE)
    expect(calculateNewRiskScore('veryHigh', RISK_SCORE, 74.91037, 58.23, 31.45)).to.eql(119.75)
  })

  it('At 13576 days', () => {
    expect(+calculateGrowthCurve(EXP_1, 13576, RISK_SCORE).toFixed(5)).to.eql(145.92341)
    expect(+calculateGrowthCurve(EXP_2, 13576, RISK_SCORE).toFixed(5)).to.eql(107.75792)

    expect(calculateNewRiskScore('veryLow', RISK_SCORE, 145.92341, 58.23, 31.45)).to.eql(RISK_SCORE)
    expect(calculateNewRiskScore('veryHigh', RISK_SCORE, 107.75792, 58.23, 31.45)).to.eql(RISK_SCORE)
  })
})
