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
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)

        done()
      }
    )
  })
})
