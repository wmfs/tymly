/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')

describe('awaitingUserInput state tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
        ],
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ]
      },
      function (err, tymlyServices) {
        done()
      }
    )
  })
})
