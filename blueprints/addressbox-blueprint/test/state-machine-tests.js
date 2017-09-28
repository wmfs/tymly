/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect
const fs = require('fs')

describe('State machine tests', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_synchronizeAddressbasePlus_1_0'
  const OUTPUT_DIR_PATH = path.resolve(__dirname, './output')
  const OUTPUT_FILE_PATH = path.resolve(OUTPUT_DIR_PATH, './delta.csv')

  let statebox
  let client

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
        client = flobotServices.storage.client
        done()
      }
    )
  })

  it('should create and populate the wmfs.gazetteer database table', function (done) {
    statebox.startExecution(
      {
        outputDir: OUTPUT_DIR_PATH,
        outputFilepath: OUTPUT_FILE_PATH
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('ExportingCsvDeltaFile')
        expect(executionDescription.ctx.outputDir).to.eql(OUTPUT_DIR_PATH)
        expect(executionDescription.ctx.outputFilepath).to.eql(OUTPUT_FILE_PATH)
        done()
      }
    )
  })

  it('should have created an output folder structure', function (done) {
    fs.stat(OUTPUT_DIR_PATH, function (err, outputStats) {
      expect(err).to.eql(null)
      if (err) {
        console.log(OUTPUT_DIR_PATH, outputStats)
        done(err)
      } else {
        done()
      }
    })
  })

  it('should have created a delta.csv file', function (done) {
    fs.stat(OUTPUT_FILE_PATH, function (err, deltaFileStats) {
      expect(err).to.eql(null)
      if (err) {
        console.log(OUTPUT_FILE_PATH, deltaFileStats)
        done(err)
      } else {
        done()
      }
    })

    it('should return 20 rows when selecting from the newly populated table', function (done) {
      client.query(`SELECT uprn FROM wmfs.gazetteer ORDER BY uprn ASC;`, [],
        function (err, result) {
          expect(err).to.eql(null)
          if (err) {
            done(err)
          } else {
            expect(result.rowCount).to.eql(20)
            expect(result.rows[12].uprn).to.eql('100040220305')
            done()
          }
        }
      )
    })
  })
})
