/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

describe('Blueprint Tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'ordnanceSurvey_importCsvFiles_1_0'
  const LIST_OF_CSV_SOURCE_FILES = [
    path.resolve(__dirname, './fixtures/sample-data/exeter-sample-data-20.csv')
  ]
  const OUTPUT_AND_INPUT_DIR = path.resolve(__dirname, './output')
  const UPSERTS_DIR = path.resolve(OUTPUT_AND_INPUT_DIR, './upserts')
  const MANIFEST_FILE = path.resolve(OUTPUT_AND_INPUT_DIR, './manifest.json')

  let tymlyService
  let statebox
  let client

  it('Should remove output directory ahead of tests, if it exists already', function (done) {
    const outputPath = path.resolve(__dirname, './output')
    if (fs.existsSync(outputPath)) {
      rimraf(outputPath, {}, done)
    } else {
      done()
    }
  })

  it('should startup tymly so that we can test the blueprint', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../../../plugins/tymly-etl-plugin'),
          path.resolve(__dirname, './../../../plugins/tymly-pg-plugin')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './..')
        ],

        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should execute the state-machine', function (done) {
    statebox.startExecution(
      {
        sourceFilePaths: LIST_OF_CSV_SOURCE_FILES,
        outputDirRootPath: OUTPUT_AND_INPUT_DIR,
        sourceDir: OUTPUT_AND_INPUT_DIR
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        expect(executionDescription.ctx.sourceFilePaths).to.eql(LIST_OF_CSV_SOURCE_FILES)
        expect(executionDescription.ctx.outputDirRootPath).to.eql(OUTPUT_AND_INPUT_DIR)
        expect(executionDescription.ctx.sourceDir).to.eql(OUTPUT_AND_INPUT_DIR)
        done()
      }
    )
  })

  it('should have created an output folder containing an upserts folder', function (done) {
    fs.stat(OUTPUT_AND_INPUT_DIR, function (err, outputStats) {
      if (err) {
        console.log(OUTPUT_AND_INPUT_DIR, outputStats)
        done(err)
      } else {
        fs.stat(UPSERTS_DIR, function (err, upsertsStats) {
          if (err) {
            console.log(UPSERTS_DIR, upsertsStats)
            done(err)
          } else {
            done()
          }
        })
      }
    })
  })

  it('should have created a manifest.json file', function (done) {
    fs.stat(MANIFEST_FILE, function (err, manifestStats) {
      if (err) {
        done(err)
      } else {
        // console.log(MANIFEST_FILE, manifestStats)
        done()
      }
    })
  })

  it('should be a line count of 20 in the manifest file ', function (done) {
    fs.readFile(MANIFEST_FILE, 'utf8', function (err, data) {
      if (err) {
        done(err)
      } else {
        let manifest = JSON.parse(data)
        // console.log(JSON.stringify(manifest, null, 2))
        expect(manifest.counts.byDir.upserts).to.eql(20)
        done()
      }
    })
  })

  it('should have created an addressbase-holding.csv file', function (done) {
    const CSV_FILE = path.resolve(UPSERTS_DIR, './addressbase-holding.csv')
    fs.stat(CSV_FILE, function (err, csvStats) {
      if (err) {
        console.log(CSV_FILE, csvStats)
        done(err)
      } else {
        done()
      }
    })
  })

  it('should return 20 rows when selecting from the newly populated table', function (done) {
    client.query('SELECT uprn, hash_sum FROM ordnance_survey.addressbase_holding ORDER BY uprn ASC;', [],
      function (err, result) {
        if (err) {
          done(err)
        } else {
          expect(result.rowCount).to.eql(20)
          expect(result.rows[8].uprn).to.eql('100040214823')
          done()
        }
      }
    )
  })

  it('Should remove output directory now tests are complete', function (done) {
    if (fs.existsSync(OUTPUT_AND_INPUT_DIR)) {
      rimraf(OUTPUT_AND_INPUT_DIR, {}, done)
    } else {
      done()
    }
  })

  it('should shutdown Tymly', () => {
    return tymlyService.shutdown()
  })
})
