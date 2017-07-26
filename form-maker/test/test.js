/* eslint-env mocha */
'use strict'

const formMaker = require('./../lib')
const expect = require('chai').expect

describe('Run some basic tests', function () {
  it('Should find models directory', function (done) {
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
