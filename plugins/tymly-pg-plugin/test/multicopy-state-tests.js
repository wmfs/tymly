/* eslint-env mocha */

'use strict'

const chai = require('chai')
const tymly = require('tymly')
const expect = chai.expect
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')

describe('Testing functionality as a state-resource', function () {
  this.timeout(50000)
  let client
  let statebox
  let STATE_MACHINE_NAME = 'foodTest_food_1_0'
  let executionName

  it('should create some tymly services to test PostgreSQL storage', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/food-blueprint')
        ],

        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        client = tymlyServices.storage.client
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should start a multicopy execution', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, 'fixtures', 'food-data')
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete a multicopy execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        done()
      }
    )
  })

  it('should find the correct data in the correct database tables (meat)', function (done) {
    client.query(
      'select * from food_test.meat',
      function (err, result) {
        expect(err).to.eql(null)
        expect(result.rows[0].food_name).to.eql('steak')
        expect(result.rows[1].food_name).to.eql('kebab')
        expect(result.rows[2].food_name).to.eql('chicken')

        expect(result.rows[0].food_group).to.eql('red meat')
        expect(result.rows[1].food_group).to.eql('red meat')
        expect(result.rows[2].food_group).to.eql('white meat')
        done()
      }
    )
  })

  it('should find the correct data in the correct database tables (veg)', function (done) {
    client.query(
      'select * from food_test.veg',
      function (err, result) {
        expect(err).to.eql(null)
        expect(result.rows[0].food_name).to.eql('peas')
        expect(result.rows[1].food_name).to.eql('carrot')
        expect(result.rows[2].food_name).to.eql('potato')

        expect(result.rows[0].food_group).to.eql('legumes')
        expect(result.rows[1].food_group).to.eql('root')
        expect(result.rows[2].food_group).to.eql('root')
        done()
      }
    )
  })

  it('should clean up DB env', function (done) {
    sqlScriptRunner(
      [
        'cleanup.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})
