/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
const turnEmptyNone = require('../functions/utils/turn-empty-none')

describe('Process empty string test', function () {
  it('Should trim a string', function () {
    expect(turnEmptyNone(' hello ')).to.be.eql('hello')
  })

  it('Should convert an empty string', function () {
    expect(turnEmptyNone('  ')).to.be.eql(null)
  })
})
