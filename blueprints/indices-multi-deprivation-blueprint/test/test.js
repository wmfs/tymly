/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(5000)

  let flobotsService

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../../../projects/tymly/plugins/flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        flobotsService = flobotServices.flobots

        done()
      }
    )
  })

  it('should create and populate the ridge.imd database table', function (done) {
    flobotsService.startNewFlobot(
      'ridge_refreshFromCsvFile_1_0',
      {
        'data': {
          'sourceDir': path.resolve(__dirname, './fixtures/input')
        }
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
