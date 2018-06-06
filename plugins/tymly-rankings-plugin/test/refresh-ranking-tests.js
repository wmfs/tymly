/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('Tests the Ranking State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox, tymlyService

  // explicitly opening a db connection as seom setup needs to be carried
  // out before tymly can be started up
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should create the test resources', () => {
    return sqlScriptRunner('./db-scripts/setup.sql', client)
  })

  it('should run the tymly service', done => {
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
      (err, tymlyServices) => {
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
      },
      'test_refreshRanking_1_0',
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        if (err) {
          return done(err)
        }
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql('test_refreshRanking_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should ensure the scores have been calculated accordingly to the initial state-machine\'s registry', async () => {
    const result = await client.query('select uprn, address_label, usage_score, food_standards_score, fs_management_score, incidents_score, heritage_score, should_be_licensed_score from test.factory_scores')
    expect(result.rows[0]).to.eql({
      uprn: '1',
      address_label: '1 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 32,
      incidents_score: 16,
      heritage_score: 2,
      should_be_licensed_score: 8
    })
    expect(result.rows[1]).to.eql({
      uprn: '2',
      address_label: '2 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 16,
      incidents_score: 0,
      heritage_score: 2,
      should_be_licensed_score: 0
    })
    expect(result.rows[2]).to.eql({
      uprn: '3',
      address_label: '3 abc lane',
      usage_score: 8,
      food_standards_score: 2,
      fs_management_score: 32,
      incidents_score: 6,
      heritage_score: 0,
      should_be_licensed_score: 0
    })
  })

  it('should start the state resource execution to update the weights and refresh the view - the usage score has changed from 8 to 12', function (done) {
    statebox.startExecution(
      {
        setRegistryKey: {
          key: 'test_factory',
          value: {
            'exponent': {
              'veryLow': '0.01',
              'medium': '0.02',
              'veryHigh': '0.03'
            },
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
            'shouldBeLicensed': {
              'type': 'options',
              'options': [
                {
                  'type': 'boolean-equals',
                  'booleanValue': true,
                  'score': 8
                },
                {
                  'type': 'boolean-equals',
                  'booleanValue': false,
                  'score': 0
                }
              ],
              'default': 0
            },
            'fsManagement': {
              'type': 'options',
              'default': 0,
              'options': [
                {
                  'type': 'numeric-rangetext-constant',
                  'textualValue': 'Very Low',
                  'score': 32
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'Average',
                  'score': 0
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'Average',
                  'score': 0
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
      }, // input
      'wmfs_setAndRefresh_1_0', // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        if (err) {
          return done(err)
        }
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
  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
  it('Should close database connections', function (done) {
    client.end()
    done()
  })
})
