/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')

describe('Blueprint Tests', function () {
  const STATE_MACHINE_NAME = 'ordnanceSurvey_importCsvFiles_1_0'
  const LIST_OF_CSV_SOURCE_FILES = [
    path.resolve(__dirname, './fixtures/sample-data/exeter-sample-data-20.csv')
  ]
  const OUTPUT_AND_INPUT_DIR = path.resolve(__dirname, './output')

  let statebox
  this.timeout(5000)

  it('should startup flobot so that we can test the blueprint', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../../../plugins/flobot-etl-plugin'),
          path.resolve(__dirname, './../../../plugins/flobot-pg-plugin')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './..')
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

  it('should find the state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
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
})
