/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const processString = require('../functions/utils/process-string')

describe('Process string tests', function () {
  it('Should process a simple string', function () {
    expect(processString('hello world!')).to.be.eql('Hello World!')
  })
  it('Should process an empty string', function () {
    expect(processString('')).to.be.eql('')
    expect(processString(' ')).to.be.eql(' ')
  })
})
