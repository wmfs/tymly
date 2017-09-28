/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const fse = require('fs-extra')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'wmfs_synchronizeAddressbasePlus_1_0'

describe('data processing', function () {
  this.timeout(5000)

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
    const outputRoot = path.resolve(__dirname, './output')
    fse.removeSync(outputRoot)
    const deltaFile = path.resolve(outputRoot, './delta.csv')

    statebox.startExecution(
      {
        outputDir: path.resolve(outputRoot, './sync'),
        outputFilePath: deltaFile
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.eql('ExportingCsvDeltaFile')
        expect(fse.existsSync(deltaFile)).to.be.true
        done()
      }
    )
  })
})
