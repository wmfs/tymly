/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')

describe('PostgreSQL storage tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('should create some tymly services', (done) => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ]
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        done(err)
      }
    )
  })
})
