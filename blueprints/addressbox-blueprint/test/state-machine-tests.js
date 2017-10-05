/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const fs = require('fs')
const rimraf = require('rimraf')
const scriptRunner = require('./fixtures/sql-script-runner')

describe('State machine tests', function () {
  this.timeout(15000)

  const STATE_MACHINE_NAME = 'wmfs_synchronizeAddressbasePlus_1_0'
  const OUTPUT_DIR_PATH = path.resolve(__dirname, './output')
  const OUTPUT_FILE_PATH = path.resolve(OUTPUT_DIR_PATH, './delta.csv')

  let statebox
  let client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should create a set of database test data', function (done) {
    scriptRunner([ 'setup.sql' ], client, done)
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
  })

  it('should return 20 rows when selecting from the newly populated table', function (done) {
    client.query('SELECT uprn FROM wmfs.gazetteer ORDER BY uprn ASC;', [],
      function (err, result) {
        expect(err).to.eql(null)
        if (err) {
          done(err)
        } else {
          expect(result.rowCount).to.eql(20)
          expect(result.rows[11].uprn).to.eql('100040220305')
          done()
        }
      }
    )
  })

  it('Should remove output directory now tests are complete', function (done) {
    if (fs.existsSync(OUTPUT_DIR_PATH)) {
      rimraf(OUTPUT_DIR_PATH, {}, done)
    } else {
      done()
    }
  })

  it('should cleanup test data', function (done) {
    scriptRunner([ 'cleanup.sql' ], client, done)
  })
})
