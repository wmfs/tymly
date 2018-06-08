/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const expect = require('chai').expect
const process = require('process')
const moment = require('moment')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const existsCase = require('./../lib/components/services/rankings/case-statements/exists.js')
const optionCase = require('./../lib/components/services/rankings/case-statements/option.js')
const constantCase = require('./../lib/components/services/rankings/case-statements/constant.js')
const generateView = require('./../lib/components/services/rankings/generate-view-statement.js')
const calculateNewRiskScore = require('./../lib/components/services/rankings/calculate-new-risk-score.js')

describe('Tests the Ranking Service', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const REFRESH_RANKING_STATE_MACHINE_NAME = 'test_refreshRanking_1_0'

  let tymlyService, statebox, rankingModel, statsModel, viewSQL
  let viewData, statsData, rankingData

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  // explicitly opening a db connection as seom setup needs to be carried
  // out before tymly can be started up
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create the test resources', () => {
    return sqlScriptRunner('./db-scripts/setup.sql', client)
  })

  it('should run the tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        rankingModel = tymlyServices.storage.models['test_rankingUprns']
        statsModel = tymlyServices.storage.models['test_modelStats']
        viewSQL = tymlyServices.rankings.viewSQL
        done()
      }
    )
  })

  it('should generate an SQL case for a numeric range', function (done) {
    const statement = optionCase(
      'foodStandards',
      {
        'type': 'options',
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
        ],
        'default': 0
      },
      'test',
      'food',
      'rating'
    )
    const expected = 'CASE WHEN food.rating::int BETWEEN 0 AND 2 THEN 8 WHEN food.rating::int BETWEEN 3 AND 4 THEN 6 WHEN food.rating::int = 5 THEN 2 ELSE 0 END AS food_standards_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL statement to check if a value exists', function (done) {
    const statement = existsCase(
      'heritage',
      {
        'type': 'exists',
        'score': 2,
        'default': 0
      },
      'test',
      'heritage',
      'uprn'
    )
    const expected = 'CASE WHEN (SELECT COUNT(*) FROM test.heritage where uprn = g.uprn) > 0 THEN 2 ELSE 0 END AS heritage_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL case for text options', function (done) {
    const statement = optionCase(
      'ofsted',
      {
        'type': 'options',
        'options': [
          {
            'type': 'text-constant',
            'textualValue': 'good',
            'score': 0
          },
          {
            'type': 'text-constant',
            'textualValue': 'average',
            'score': 5
          },
          {
            'type': 'text-constant',
            'textualValue': 'bad',
            'score': 8
          }
        ],
        'default': 0
      },
      'test',
      'ofsted',
      'uprn'
    )
    const expected = 'CASE WHEN upper(ofsted.uprn) = upper(\'good\') THEN 0 WHEN upper(ofsted.uprn) = upper(\'average\') THEN 5 WHEN upper(ofsted.uprn) = upper(\'bad\') THEN 8 ELSE 0 END AS ofsted_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL statement for a constant value', function (done) {
    const statement = constantCase(
      'usage',
      {
        'type': 'constant',
        'score': 8
      },
      'test',
      'usage',
      'uprn'
    )
    const expected = '8 as usage_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL view statement for manually entered options', function (done) {
    const statement = generateView({
      'category': 'factory',
      'schema': 'test',
      'source': {
        'model': 'gazetteer',
        'property': 'uprn',
        'otherProperties': ['address_label']
      },
      'ranking': {
        'usage': 'constant',
        'foodStandards': {
          'namespace': 'test',
          'model': 'food_table',
          'property': 'rating'
        }
      },
      'registry': {
        'value': {
          'usage': {
            'type': 'constant',
            'score': 10
          },
          'foodStandards': {
            'type': 'options',
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
            ],
            'default': 0
          }
        }
      }
    })
    const expected = 'CREATE OR REPLACE VIEW test.factory_scores AS ' +
      'SELECT DISTINCT scores.uprn, scores.address_label, scores.usage_score, scores.food_standards_score, ' +
      'CASE WHEN scores.risk_score IS NOT NULL THEN scores.risk_score ELSE scores.usage_score + scores.food_standards_score END AS risk_score ' +
      'FROM (SELECT g.uprn, g.address_label as address_label, ' +
      '10 as usage_score, ' +
      'CASE WHEN food_table.rating::int BETWEEN 0 AND 2 THEN 8 WHEN food_table.rating::int BETWEEN 3 AND 4 THEN 6 WHEN food_table.rating::int = 5 THEN 2 ELSE 0 END AS food_standards_score, ' +
      'rank.updated_risk_score AS risk_score ' +
      'FROM test.gazetteer g  ' +
      'LEFT JOIN test.food_table food_table ON food_table.uprn = g.uprn  ' +
      'JOIN test.ranking_uprns rank ON rank.uprn = g.uprn ' +
      'WHERE rank.ranking_name = \'factory\'::text ) scores'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should execute the generated view statement', async () => {
    await client.query(viewSQL['test_factory'])
  })

  it('should ensure the generated view holds the correct data', async () => {
    viewData = await client.query('select * from test.factory_scores')
    expect(viewData.rows[0]).to.eql({
      uprn: '1',
      address_label: '1 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 32,
      incidents_score: 16,
      heritage_score: 2,
      risk_score: '74',
      should_be_licensed_score: 8
    })
    expect(viewData.rows[1]).to.eql({
      uprn: '2',
      address_label: '2 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 16,
      incidents_score: 0,
      heritage_score: 2,
      risk_score: '34',
      should_be_licensed_score: 0
    })
    expect(viewData.rows[2]).to.eql({
      uprn: '3',
      address_label: '3 abc lane',
      usage_score: 8,
      food_standards_score: 2,
      fs_management_score: 32,
      incidents_score: 6,
      heritage_score: 0,
      risk_score: '48',
      should_be_licensed_score: 0
    })
    expect(viewData.rows[3]).to.eql({
      uprn: '4',
      address_label: '4 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 0,
      incidents_score: 6,
      heritage_score: 2,
      risk_score: '24',
      should_be_licensed_score: 0
    })
    expect(viewData.rows[4]).to.eql({
      uprn: '5',
      address_label: '5 abc lane',
      usage_score: 8,
      food_standards_score: 8,
      fs_management_score: 32,
      incidents_score: 16,
      heritage_score: 0,
      risk_score: '72',
      should_be_licensed_score: 8
    })
    expect(viewData.rows[5]).to.eql({
      uprn: '6',
      address_label: '6 abc lane',
      usage_score: 8,
      food_standards_score: 2,
      fs_management_score: 32,
      incidents_score: 0,
      heritage_score: 2,
      risk_score: '44',
      should_be_licensed_score: 0
    })

    expect(viewData.rows[6].risk_score).to.eql('16')
    expect(viewData.rows[7].risk_score).to.eql('64')
    expect(viewData.rows[8].risk_score).to.eql('20')
    expect(viewData.rows[9].risk_score).to.eql('70')
    expect(viewData.rows[10].risk_score).to.eql('0')
    expect(viewData.rows[11].risk_score).to.eql('52')
    expect(viewData.rows[12].risk_score).to.eql('72')
  })

  it('should check the data in the statistics model', async () => {
    statsData = await statsModel.findById('factory')
    expect(statsData.category).to.eql('factory')
    expect(statsData.count).to.eql(13)
    expect(statsData.mean).to.eql('45.38')
    expect(statsData.median).to.eql('48.00')
    expect(statsData.variance).to.eql('568.85')
    expect(statsData.stdev).to.eql('23.85')
    expect(statsData.ranges).to.eql({
      veryLow: {lowerBound: 0, upperBound: '21.53', exponent: '-0.00088'},
      veryHigh: {lowerBound: '69.25', upperBound: 74, exponent: '-0.0075'},
      medium: {lowerBound: '21.54', upperBound: '69.24', exponent: '-0.0004'}
    })
  })

  it('should check the data in ranking model', async () => {
    rankingData = await rankingModel.find({})

    for (let r of rankingData) {
      expect(r.growthCurve).to.eql(null)
      expect(r.updatedRiskScore).to.eql(null)
    }

    expect(rankingData[0].uprn).to.eql('1')
    expect(rankingData[0].range).to.eql('very-high')
    expect(rankingData[0].distribution).to.eql('0.0081')

    expect(rankingData[1].uprn).to.eql('2')
    expect(rankingData[1].range).to.eql('medium')
    expect(rankingData[1].distribution).to.eql('0.0149')

    expect(rankingData[2].uprn).to.eql('3')
    expect(rankingData[2].range).to.eql('medium')
    expect(rankingData[2].distribution).to.eql('0.0166')

    expect(rankingData[3].uprn).to.eql('4')
    expect(rankingData[3].range).to.eql('medium')
    expect(rankingData[3].distribution).to.eql('0.0112')

    expect(rankingData[4].uprn).to.eql('5')
    expect(rankingData[4].range).to.eql('very-high')
    expect(rankingData[4].distribution).to.eql('0.0090')

    expect(rankingData[5].uprn).to.eql('6')
    expect(rankingData[5].range).to.eql('medium')
    expect(rankingData[5].distribution).to.eql('0.0167')
  })

  it('should change the date for one of the factory properties to be today\'s date', async () => {
    await rankingModel.upsert({
      uprn: 5,
      rankingName: 'factory',
      lastAuditDate: new Date()
    }, {
      setMissingPropertiesToNull: false
    })
  })

  it('should refresh the rankings for factory via state machine since we\'ve changed the date', (done) => {
    statebox.startExecution(
      {
        schema: 'test',
        category: 'factory'
      },
      REFRESH_RANKING_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        done()
      }
    )
  })

  it('should check the growth curve has changed', async () => {
    const doc = await rankingModel.findById(5)
    expect(+doc.growthCurve).to.not.eql(null)
    expect(+doc.growthCurve).to.eql(0.87805)
    expect(+doc.updatedRiskScore).to.eql(35.5)
  })

  it('should change the date for one of the factory properties to be 20 days ago', async () => {
    await rankingModel.upsert({
      uprn: 5,
      rankingName: 'factory',
      lastAuditDate: moment().subtract(20, 'days')
    }, {
      setMissingPropertiesToNull: false
    })
  })

  it('should refresh the rankings for factory via state machine since we\'ve changed the date again', (done) => {
    statebox.startExecution(
      {
        schema: 'test',
        category: 'factory'
      },
      REFRESH_RANKING_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        done()
      }
    )
  })

  it('should check the growth curve has changed again', async () => {
    const doc = await rankingModel.findById(5)
    expect(+doc.growthCurve).to.eql(0.43636)
    expect(+doc.updatedRiskScore).to.eql(18.19)
  })

  it('should calculate new risk score', () => {
    const options = {
      riskScore: 146,
      growthCurve: 1.78,
      mean: 88.19,
      stdev: 11.81
    }

    const highExpected = options.growthCurve + ((options.mean + options.stdev) / 2)
    const lowExpected = (options.riskScore / 2) + options.growthCurve

    expect(+calculateNewRiskScore('veryHigh', options.riskScore, options.growthCurve, options.mean, options.stdev)).to.eql(highExpected)
    expect(+calculateNewRiskScore('veryLow', options.riskScore, options.growthCurve, options.mean, options.stdev)).to.eql(lowExpected)
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
