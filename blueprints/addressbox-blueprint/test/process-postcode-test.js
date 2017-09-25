/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const processPostcode = require('../functions/utils/process-postcode')

describe('Process postcode tests', function () {
  it('Should process a postcode entry', function () {
    expect(processPostcode('cV47aL')).to.be.eql('CV4 7AL')
    expect(processPostcode(' cV4 7aL')).to.be.eql('CV4 7AL')
    expect(processPostcode(' cv4 7al')).to.be.eql('CV4 7AL')
    expect(processPostcode(null)).to.be.eql(null)
    expect(processPostcode('')).to.be.eql(' ')
  })
})
