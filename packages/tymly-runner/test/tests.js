/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('Simple Tymly test', function () {
  this.timeout(5000)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../../../plugins/tymly-pg-plugin')
        ],
        blueprintPaths: []
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)

        done()
      }
    )
  })
})
