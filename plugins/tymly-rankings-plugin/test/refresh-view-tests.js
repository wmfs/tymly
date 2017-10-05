/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')

describe('Tests ranking of data', function () {
  this.timeout(5000)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/ridge-blueprint')
        ],
        config: {}

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
