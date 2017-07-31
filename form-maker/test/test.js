/* eslint-env mocha */
'use strict'

const formMaker = require('./../lib')
// const propertyGenerator = require('./../lib/property-generator')
const expect = require('chai').expect

describe('Run some basic tests', function () {
  it('Should generate form schema and editor flow', function (done) {
    formMaker(
      {
        blueprintDir: 'c:/development/blueprints/addressbox-blueprint'
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})
