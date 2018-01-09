/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('Tests the Ranking State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox
  let tymlyService
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create the test resources', () => {
    return sqlScriptRunner('./db-scripts/setup.sql', client)
  })

  it('should run the tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './..'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprint'),
          path.resolve(__dirname, '../lib/blueprints/ranking-blueprint')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should start the state resource execution to generate view with initial weights', function (done) {
    statebox.startExecution(
      {
        schema: 'test',
        category: 'factory'
      },  // input
      'test_refreshRanking_1_0', // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql('test_refreshRanking_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should ensure the scores have been calculated accordingly to the initial state-machine\'s registry', function (done) {
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

  it('should start the state resource execution to update the weights and refresh the view - the usage score has changed from 8 to 12', function (done) {
    statebox.startExecution(
      {
        setRegistryKey: {
          key: 'test_factory',
          value: {
            'usage': {
              'type': 'constant',
              'score': 12
            },
            'foodStandards': {
              'type': 'options',
              'default': 0,
              'options': [
                {
                  'type': 'numeric-range',
                  'minimum': 0,
                  'maximum': 2,
                  'score': 8
                },
                {
                  'type': 'numeric-range',
                  'minimum': 3,
                  'maximum': 4,
                  'score': 6
                },
                {
                  'type': 'numeric-constant',
                  'numericValue': 5,
                  'score': 2
                }
              ]
            },
            'incidents': {
              'type': 'options',
              'default': 0,
              'options': [
                {
                  'type': 'numeric-constant',
                  'numericValue': 0,
                  'score': 0
                },
                {
                  'type': 'numeric-constant',
                  'numericValue': 1,
                  'score': 6
                },
                {
                  'type': 'numeric-boundary',
                  'operator': 'greaterThan',
                  'numericValue': 1,
                  'score': 16
                }
              ]
            },
            'heritage': {
              'type': 'exists',
              'default': 0,
              'score': 2
            }
          }
        },
        refreshRanking: {
          schema: 'test',
          category: 'factory'
        }
      },  // input
      'wmfs_setAndRefresh_1_0', // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql('wmfs_setAndRefresh_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should ensure the scores have been adjusted accordingly to the new weights - the usage score has changed from 8 to 12', function (done) {
    client.query('select * from test.factory_scores', function (err, result) {
      expect(err).to.equal(null)
      if (err) {
        done(err)
      } else {
        expect(result.rows[0]['usage_score']).to.equal(12)
        expect(result.rows[1]['usage_score']).to.equal(12)
        expect(result.rows[2]['usage_score']).to.equal(12)
        done()
      }
    })
  })

  it('should clean up the test resources', () => {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should delete this registry key', function (done) {
    client.query('DELETE FROM tymly.registry_key WHERE key = \'test_factory\'', function (err) {
      expect(err).to.equal(null)
      if (err) {
        done(err)
      } else {
        done()
      }
    })
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
