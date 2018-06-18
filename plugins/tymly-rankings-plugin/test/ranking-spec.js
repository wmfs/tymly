/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const moment = require('moment')
const WEIGHTS_TO_UPDATE = require('./fixtures/updated-weights.json')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

describe('Tests the Ranking State Resource', function () {
  this.timeout(15000)

  const REFRESH_STATE_MACHINE_NAME = `test_refreshRanking_1_0`
  const SET_REFRESH_STATE_MACHINE_NAME = `wmfs_setAndRefresh_1_0`
  const REFRESH_RISK_STATE_MACHINE_NAME = `test_refreshRiskScore_1_0`

  const originalScores = []

  let statebox, tymlyService, rankingModel, statsModel

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

  it('should check the data, when sorted is in order from very-low to very-high (to check the low and high risk scores get the right range)', async () => {
    const viewData = await client.query(`select * from test.factory_scores`)
    const rankingData = await rankingModel.find({})
    const statsData = await statsModel.findById('factory')
    const mergedData = rankingData
      .map((r, i) => {
        return {
          uprn: r.uprn,
          score: viewData.rows[i].updated_risk_score || viewData.rows[i].original_risk_score,
          range: r.range
        }
      })
      .sort((b, c) => {
        return b.score - c.score
      })

    expect(mergedData[0].range).to.eql('very-low')
    expect(mergedData[mergedData.length - 1].range).to.eql('very-high')

    originalScores.push(mergedData[0], mergedData[mergedData.length - 1])

    expect(statsData.ranges.veryLow.lowerBound).to.eql(0)
    expect(statsData.ranges.veryHigh.upperBound).to.eql(mergedData[mergedData.length - 1].score)
    expect(statsData.count).to.eql(13)
    expect(+statsData.mean).to.eql(58.23)
    expect(+statsData.stdev).to.eql(31.45)
  })

  it('should update the ranking model with fire safety level', async () => {
    await rankingModel.upsert({
      uprn: originalScores[0].uprn,
      rankingName: 'factory',
      fsManagement: 'high',
      lastAuditDate: new Date(),
      lastEnforcementAction: 'SATISFACTORY'
    }, {})
    await rankingModel.upsert({
      uprn: originalScores[1].uprn,
      rankingName: 'factory',
      fsManagement: 'veryLow',
      lastAuditDate: new Date(),
      lastEnforcementAction: 'ENFORCEMENT'
    }, {})

    // Changing fsManagement and lastEnforcementAction affects the risk score so let's get the updated one
    const a = await client.query(`select original_risk_score from test.factory_scores where uprn = ${originalScores[0].uprn}`)
    const b = await client.query(`select original_risk_score from test.factory_scores where uprn = ${originalScores[1].uprn}`)

    // fsManagement score for high = 20
    // lastEnforcementAction score for SATISFACTORY = -16
    // A should change by (20 + -16 = 4)
    expect(a.rows[0].original_risk_score).to.eql(originalScores[0].score + 4)

    // fsManagement score for veryLow = 60
    // lastEnforcementAction score for ENFORCEMENT = 64
    // B should change by (60 + 64 = 124)
    expect(b.rows[0].original_risk_score).to.eql(originalScores[1].score + 124)

    // Update originalScores
    originalScores[0].score = a.rows[0].original_risk_score
    originalScores[1].score = b.rows[0].original_risk_score
  })

  it('should refresh ranking', async () => {
    const execDesc = await statebox.startExecution(
      {schema: 'test', category: 'factory'},
      REFRESH_STATE_MACHINE_NAME,
      {sendResponse: 'COMPLETE'}
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
  })

  // a = high, exp = -0.001, score = 26
  // b = veryLow, exp = -0.004, score = 246

  // mean = 68.07692
  // stdev = 57.18453

  // ---- Day 0 ----

  // Growth curve
  // a = 26 / ( 1 + ( 81 * ( e ^ ( 0 * -0.001 ) ) ) ) = 0.31707
  // b = 246 / ( 1 + ( 81 * ( e ^ ( 0 * -0.004 ) ) ) ) = 3

  // Expected score
  // a = ( ( 68.07692 + 57.18453 ) / 2 ) + 0.31707 = 62.947795**
  // b = ( 246 / 2 ) + 3 = 126

  // ** More than risk score, so return risk score

  it('should check the updated risk score', async () => {
    const a = await rankingModel.findById(originalScores[0].uprn)
    const b = await rankingModel.findById(originalScores[1].uprn)

    expect(+a.updatedRiskScore).to.eql(13)    // medium risk goes to half original score on day 0
    expect(+b.updatedRiskScore).to.eql(62.62)   // high risk goes to (mean + stddev) / 2 on day 0
  })

  it('should change the last audit dates to 365 days from now', async () => {
    await rankingModel.upsert({
      uprn: originalScores[0].uprn,
      rankingName: 'factory',
      lastAuditDate: moment().subtract(365, 'days')
    }, {
      setMissingPropertiesToNull: false
    })
    await rankingModel.upsert({
      uprn: originalScores[1].uprn,
      rankingName: 'factory',
      lastAuditDate: moment().subtract(365, 'days')
    }, {
      setMissingPropertiesToNull: false
    })
  })

  it('should refresh ranking again', async () => {
    const execDesc = await statebox.startExecution(
      {schema: 'test', category: 'factory'},
      REFRESH_STATE_MACHINE_NAME,
      {sendResponse: 'COMPLETE'}
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
  })

  // ---- Day 365 ----
  // Growth curve intersection
  // b = 830 days
  // a = 4394 days

  // Expected score
  // b = 246 / ( 1 + ( 81 * ( e ^ ( (365+830) * -0.004 ) ) ) ) = 146.42
  // a = 26 / ( 1 + ( 81 * ( e ^ ( (365+4394) * -0.001 ) ) ) ) = 15.34

  // ** More than risk score, so return risk score

  it('should check the updated risk score after 365 days', async () => {
    const a = await rankingModel.findById(originalScores[0].uprn)
    const b = await rankingModel.findById(originalScores[1].uprn)

    expect(+a.updatedRiskScore).to.eql(15.34)
    expect(+b.updatedRiskScore).to.eql(146.42)
  })

  it('should run the set and refresh state machine', async () => {
    // lastEnforcement SATISFACTORY was changed from -16 to -8
    const execDesc = await statebox.startExecution(
      {
        setRegistryKey: {
          key: 'test_factory',
          value: WEIGHTS_TO_UPDATE
        },
        refreshRanking: {
          schema: 'test',
          category: 'factory'
        }
      },
      SET_REFRESH_STATE_MACHINE_NAME,
      {sendResponse: 'COMPLETE'}
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
  })

  it('should check the view data has been adjusted', async () => {
    const a = await client.query(`select * from test.factory_scores where uprn = ${originalScores[0].uprn}`)
    const b = await client.query(`select * from test.factory_scores where uprn = ${originalScores[1].uprn}`)

    // Changes
    expect(a.rows[0].last_enforcement_score).to.eql(-8)
    expect(a.rows[0].original_risk_score).to.eql(originalScores[0].score + 8)

    // Remains the same
    expect(b.rows[0].last_enforcement_score).to.eql(64)
    expect(b.rows[0].original_risk_score).to.eql(originalScores[1].score)
  })

  it('should run the state machine to refresh risk score', async () => {
    const execDesc = await statebox.startExecution(
      {
        schema: 'test',
        category: 'factory',
        uprn: 1
      },
      REFRESH_RISK_STATE_MACHINE_NAME,
      {sendResponse: 'COMPLETE'}
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
  })

  it('should run the state machine to refresh ranking without passing in any schema/category', async () => {
    const execDesc = await statebox.startExecution(
      {},
      REFRESH_STATE_MACHINE_NAME,
      {sendResponse: 'COMPLETE'}
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
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
