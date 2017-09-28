/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('data processing', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_synchronizeAddressbasePlus_1_0'

  let statebox

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        done()
      }
    )
  })

  it('should create and populate the ridge.imd database table', function (done) {
    // this.skip()

    statebox.startExecution(
      {
        outputDir: path.resolve(__dirname, './output'),
        outputFilepath: path.resolve(__dirname, './output/delta.csv')
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        done()
      }
    )
  })
})
