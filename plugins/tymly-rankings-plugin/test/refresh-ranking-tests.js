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

  const REFRESH_STATE_MACHINE_NAME = 'test_refreshRanking_1_0'
  const SET_REFRESH_STATE_MACHINE_NAME = 'wmfs_setAndRefresh_1_0'

  let statebox, tymlyService, rankingModel, statsModel, ranges

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
        rankingModel = tymlyServices.storage.models['test_rankingUprns']
        statsModel = tymlyServices.storage.models['test_modelStats']
        done()
      }
    )
  })

  it('should check the original view and models', async () => {
    const viewData = await client.query(`select * from test.factory_scores;`)
    expect(viewData.rows[0].risk_score).to.eql('135')
    expect(viewData.rows[3].risk_score).to.eql('24')
    expect(viewData.rows[10].risk_score).to.eql('0')

    const rankingData = await rankingModel.find({})
    expect(rankingData[0].range).to.eql('very-high')
    expect(rankingData[3].range).to.eql('medium')
    expect(rankingData[10].range).to.eql('very-low')

    const statsData = await statsModel.findById('factory')
    ranges = statsData.ranges

    expect(+viewData.rows[0].risk_score >= +ranges.veryHigh.lowerBound).to.eql(true)
    expect(+viewData.rows[0].risk_score <= +ranges.veryHigh.upperBound).to.eql(true)

    expect(+viewData.rows[3].risk_score >= +ranges.medium.lowerBound).to.eql(true)
    expect(+viewData.rows[3].risk_score <= +ranges.medium.upperBound).to.eql(true)

    expect(+viewData.rows[10].risk_score >= +ranges.veryLow.lowerBound).to.eql(true)
    expect(+viewData.rows[10].risk_score <= +ranges.veryLow.upperBound).to.eql(true)
  })

  it('should change some scores to affect the results', async () => {
    await client.query(`insert into test.fsman (uprn, rating) values (1, 'very-high') on conflict (uprn) do update set rating = 'very-high';`)
    await client.query(`insert into test.food (uprn, rating) values (4, 4) on conflict (uprn) do update set rating = 4;`)
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
                  'type': 'text-constant',
                  'textualValue': 'Very Low',
                  'score': 64
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'Low',
                  'score': 32
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'Average',
                  'score': 0
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'High',
                  'score': -8
                },
                {
                  'type': 'text-constant',
                  'textualValue': 'High',
                  'score': -16
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
      SET_REFRESH_STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        if (err) {
          return done(err)
        }
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql(SET_REFRESH_STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should check the ranking model against the ranges', async () => {
    const viewData = await client.query(`select * from test.factory_scores;`)
    const rankingData = await rankingModel.find({})
    const statsData = await statsModel.findById('factory')
    ranges = statsData.ranges

    expect(rankingData[0].range).to.eql('very-high')
    expect(rankingData[3].range).to.eql('medium')
    expect(rankingData[10].range).to.eql('very-low')

    expect(+viewData.rows[0].risk_score >= ranges.medium.lowerBound).to.eql(true)
    expect(+viewData.rows[0].risk_score <= ranges.medium.upperBound).to.eql(true)

    expect(+viewData.rows[3].risk_score >= ranges.medium.lowerBound).to.eql(true)
    expect(+viewData.rows[3].risk_score <= ranges.medium.upperBound).to.eql(true)

    expect(+viewData.rows[10].risk_score >= ranges.veryLow.lowerBound).to.eql(true)
    expect(+viewData.rows[10].risk_score <= ranges.veryLow.upperBound).to.eql(false)

    expect(viewData.rows[0]['usage_score']).to.equal(12)
    expect(+viewData.rows[0].risk_score).to.eql(46)

    expect(viewData.rows[3]['usage_score']).to.equal(12)
    expect(+viewData.rows[3].risk_score).to.eql(26)

    expect(viewData.rows[10]['usage_score']).to.equal(12)
    expect(+viewData.rows[10].risk_score).to.eql(20)
  })

  it('should ensure the scores have been adjusted accordingly to the new weights - the usage score has changed from 8 to 12', async () => {
    const result = await client.query('select * from test.factory_scores')
    expect(result.rows[0]['usage_score']).to.equal(12)
    expect(+result.rows[0].risk_score).to.eql(46)

    expect(result.rows[3]['usage_score']).to.equal(12)
    expect(+result.rows[3].risk_score).to.eql(26)

    expect(result.rows[10]['usage_score']).to.equal(12)
    expect(+result.rows[10].risk_score).to.eql(20)
  })

  it('should refresh ranking', function (done) {
    statebox.startExecution(
      {
        schema: 'test',
        category: 'factory'
      },
      REFRESH_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql(REFRESH_STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should check the data, when sorted is in order from very-low to very-high (to check the low and high risk scores get the right range)', async () => {
    const viewData = await client.query(`select * from test.factory_scores`)
    const rankingData = await rankingModel.find({})
    const mergedData = rankingData
      .map((r, i) => {
        return {
          uprn: r.uprn,
          score: viewData.rows[i].risk_score,
          range: r.range
        }
      })
      .sort((b, c) => {
        return b.score - c.score
      })
    expect(mergedData[0].range).to.eql('very-low')
    expect(mergedData[mergedData.length - 1].range).to.eql('very-high')
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
