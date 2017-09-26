/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')

describe('Blueprint Tests', function () {
  let client
  let statebox
  let executionName

  const STATE_MACHINE_NAME = 'ordnanceSurvey_importCsvFiles_1_0'
  const LIST_OF_CSV_SOURCE_FILES = [
    path.resolve(__dirname, './fixtures/sample-data/exeter-sample-data-20.csv')
  ]
  const OUTPUT_DIR_PATH = path.resolve(__dirname, './output')

  it('should create some flobot services to test the blueprint', function (done) {
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
        client = flobotServices.storage.client
        statebox = flobotServices.statebox
        done()
      }
    )
  })

  it('should find the state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should start an execution', function (done) {
    statebox.startExecution(
      {
        sourceFilePaths: LIST_OF_CSV_SOURCE_FILES,
        outputDirRootPath: OUTPUT_DIR_PATH,
        sourceDir: OUTPUT_DIR_PATH
      },
      STATE_MACHINE_NAME,
      {}, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        executionName = executionDescription.executionName
        done()
      }
    )
  })

  it('should succeed the execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        expect(executionDescription.ctx.sourceFilePaths).to.eql(LIST_OF_CSV_SOURCE_FILES)
        expect(executionDescription.ctx.outputDirRootPath).to.eql(OUTPUT_DIR_PATH)
        expect(executionDescription.ctx.sourceDir).to.eql(OUTPUT_DIR_PATH)
        done()
      }
    )
  })

  it('Should shutdown the db client', function () {
    client.end()
  })
})
