/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const STATE_MACHINE_NAME = 'test_refreshRanking_1_0'

describe('Tests the Ranking State Resource', function () {
  this.timeout(5000)
  let statebox
  let client
  it('should run the tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './..'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprint')
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

  it('should create the test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/setup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })

  it('should start the state resource execution', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should ensure the scores have been adjusted accordingly to the state-machine\'s registry', function (done) {
    client.query(
      'select * from test.factory_scores',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows[0]).to.eql({
            uprn: '1',
            address_label: '1 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 16,
            heritage_score: 2,
            risk_score: 34
          })
          expect(result.rows[1]).to.eql({
            uprn: '2',
            address_label: '2 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 0,
            heritage_score: 2,
            risk_score: 18
          })
          expect(result.rows[2]).to.eql({
            uprn: '3',
            address_label: '3 abc lane',
            usage_score: 8,
            food_standards_score: 2,
            incidents_score: 6,
            heritage_score: 0,
            risk_score: 16
          })
          done()
        }
      }
    )
  })

  it('should clean up the test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/cleanup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })
})
