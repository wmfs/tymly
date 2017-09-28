/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'wmfs_refreshFromXmlFile_1_0'
const Statebox = require('statebox')

describe('data import', function () {
  this.timeout(5000)

  let statebox = new Statebox()

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-etl-plugin'),
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

  it('should create and populate the wmfs.food_ratings database table', function (done) {
    statebox.startExecution(
      {
        xmlPath: path.resolve(__dirname, './fixtures/food_ratings.xml'),
        csvPath: path.resolve(__dirname, './input/food_ratings.csv'),
        sourceDir: path.resolve(__dirname, './fixtures/input')
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
