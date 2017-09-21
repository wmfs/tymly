/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('Simple Flobot test', function () {
  this.timeout(8000)

  it('should create some basic flobot services', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../../../plugins/flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../../../../../blueprints/indices-multi-deprivation-blueprint')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)

        done()
      }
    )
  })
})
