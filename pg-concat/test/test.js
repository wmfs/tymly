/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
const pgConcat = require('./../lib')

describe('Run some basic tests', function () {
  it('Should generate an SQL statement', function (done) {
    let statement = pgConcat(
      [
        {columnName: 'incident_no'},
        '/',
        {columnName: 'year', default: 1900}
      ]
    )
    expect(statement).to.not.equal(null)
    expect(statement).to.be.a('string')
    done()
  })

  it('Should return undefined when 0 parts passed', function (done) {
    let statement = pgConcat()
    expect(statement).to.equal(undefined)
    done()
  })

  it('Should return undefined when 1 part passed and it isn\'t a table name', function (done) {
    let statement = pgConcat([ { columnName: 'incident_number' } ])
    expect(statement).to.not.equal(null)
    expect(statement).to.be.a('string')
    done()
  })
})
