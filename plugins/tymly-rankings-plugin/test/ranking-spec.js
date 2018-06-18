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
  const AuditDate = () => moment([2018, 5, 18])
  let TestTimestamp

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

  describe('setup', () => {
    it('create test resources', () => {
      return sqlScriptRunner('./db-scripts/setup.sql', client)
    })

    it('start tymly', done => {
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
          tymlyServices.timestamp.timeProvider = {
            today () {
              return moment(TestTimestamp)
            }
          } // debug provider

          done()
        }
      )
    })

    it('verify initial data', async () => {
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
  })

  describe('calculated risk scores', () => {
    describe('update with fire safety level', () => {
      it('update the ranking model with fire safety level', async () => {
        await rankingModel.upsert({
          uprn: originalScores[0].uprn,
          rankingName: 'factory',
          fsManagement: 'high',
          lastAuditDate: AuditDate(),
          lastEnforcementAction: 'SATISFACTORY'
        }, {})
        await rankingModel.upsert({
          uprn: originalScores[1].uprn,
          rankingName: 'factory',
          fsManagement: 'veryLow',
          lastAuditDate: AuditDate(),
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
    })

    const refreshTests = [
      {
        days: 0,
        a_score: 13,
        b_score: 62.62
      },
      {
        days: 365,
        a_score: 15.34,
        b_score: 146.42
      },
      {
        days: 730,
        a_score: 17.54,
        b_score: 212.45
      },
      {
        days: 1460,
        a_score: 21.10,
        b_score: 243.92
      }
    ]

    // a = high, exp = -0.001, score = 26
    // b = veryLow, exp = -0.004, score = 246

    // mean = 68.07692
    // stdev = 57.18453

    // ---- Day 0 ----
    // medium risk goes to half original score on day 0
    // high risk goes to (mean + stddev) / 2 on day 0
    // Growth curve intersection
    // a = 4394 days
    // b = 830 days
    // Expected score after 365
    // a = 26 / ( 1 + ( 81 * ( e ^ ( (365+4394) * -0.001 ) ) ) ) = 15.34
    // b = 246 / ( 1 + ( 81 * ( e ^ ( (365+830) * -0.004 ) ) ) ) = 146.42
    // Expected score after 730
    // a = 26 / ( 1 + ( 81 * ( e ^ ( (730+4394) * -0.001 ) ) ) ) = 17.54
    // b = 246 / ( 1 + ( 81 * ( e ^ ( (730+830) * -0.004 ) ) ) ) = 212.45
    // Expected score after 1460
    // a = 26 / ( 1 + ( 81 * ( e ^ ( (1460+4394) * -0.001 ) ) ) ) = 21.10
    // b = 246 / ( 1 + ( 81 * ( e ^ ( (1460+830) * -0.004 ) ) ) ) = 243.92

    for (const rt of refreshTests) {
      describe(`audit was ${rt.days} ago`, () => {
        it ('refresh ranking', async () => {
          TestTimestamp = AuditDate().add(rt.days, 'days')

          const execDesc = await statebox.startExecution(
            {schema: 'test', category: 'factory'},
            REFRESH_STATE_MACHINE_NAME,
            {sendResponse: 'COMPLETE'}
          )
          expect(execDesc.status).to.eql('SUCCEEDED')
        })
        it(`verify calculated risk score on day ${rt.days}`, async () => {
          const a = await rankingModel.findById(originalScores[0].uprn)
          const b = await rankingModel.findById(originalScores[1].uprn)

          expect(+a.updatedRiskScore).to.eql(rt.a_score)
          expect(+b.updatedRiskScore).to.eql(rt.b_score)
        })

        it(`verify projected dates`, async () => {
          const a = await rankingModel.findById(originalScores[0].uprn)
          const b = await rankingModel.findById(originalScores[1].uprn)

          // projected dates don't change
          expect(a.projectedHighRiskCrossover).to.eql(null)
          expect(moment(a.projectedReturnToOriginal).format('YYYY-MM-DD')).to.eql('2027-04-11')

          expect(moment(b.projectedHighRiskCrossover).format('YYYY-MM-DD')).to.eql('2019-03-22')
          expect(moment(b.projectedReturnToOriginal).format('YYYY-MM-DD')).to.eql('2022-12-17')
        })
      })
    }
  })

  describe('stats table', () => {
    it ('verify stats table', async() => {
      const statsData = await statsModel.findById('factory')

      expect(statsData.count).to.eql(13)
      expect(+statsData.mean).to.eql(68.08)
      expect(+statsData.stdev).to.eql(57.18)
      expect(+statsData.variance).to.eql(3270.07)
      expect(+statsData.median).to.eql(68)
    })
  })

  describe('rankings view', () => {
    it('run set and refresh state machine', async () => {
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

    it('verify view data has been adjusted', async () => {
      const a = await client.query(`select * from test.factory_scores where uprn = ${originalScores[0].uprn}`)
      const b = await client.query(`select * from test.factory_scores where uprn = ${originalScores[1].uprn}`)

      // Changes
      expect(a.rows[0].last_enforcement_score).to.eql(-8)
      expect(a.rows[0].original_risk_score).to.eql(originalScores[0].score + 8)

      // Remains the same
      expect(b.rows[0].last_enforcement_score).to.eql(64)
      expect(b.rows[0].original_risk_score).to.eql(originalScores[1].score)
    })
  })

  describe('refresh risk scores state machine', () => {
    it('refresh risk score', async () => {
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

    it('refresh ranking without passing in any schema/category', async () => {
      const execDesc = await statebox.startExecution(
        {},
        REFRESH_STATE_MACHINE_NAME,
        {sendResponse: 'COMPLETE'}
      )
      expect(execDesc.status).to.eql('SUCCEEDED')
    })
  })

  describe('clean up', () => {
    it('clean up test resources', () => {
      return sqlScriptRunner('./db-scripts/cleanup.sql', client)
    })

    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })

    it('close database connections', function (done) {
      client.end()
      done()
    })
  })
})
