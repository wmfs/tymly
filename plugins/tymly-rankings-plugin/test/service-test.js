/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const existsCase = require('./../lib/components/services/rankings/case-statements/exists.js')
const optionCase = require('./../lib/components/services/rankings/case-statements/option.js')
const constantCase = require('./../lib/components/services/rankings/case-statements/constant.js')
const generateView = require('./../lib/components/services/rankings/generate-view-statement.js')

describe('Tests the Ranking Service', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, rankingModel, statsModel, viewSQL

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
        rankingModel = tymlyServices.storage.models['test_rankingUprns']
        statsModel = tymlyServices.storage.models['test_modelStats']
        viewSQL = tymlyServices.rankings.viewSQL
        done()
      }
    )
  })

  it('should generate an SQL case for a numeric range', function (done) {
    let statement = optionCase(
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
    let expected = 'CASE WHEN food.rating BETWEEN 0 AND 2 THEN 8 WHEN food.rating BETWEEN 3 AND 4 THEN 6 WHEN food.rating = 5 THEN 2 ELSE 0 END AS food_standards_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL statement to check if a value exists', function (done) {
    let statement = existsCase(
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
    let expected = 'CASE WHEN (SELECT COUNT(*) FROM test.heritage where uprn = g.uprn) > 0 THEN 2 ELSE 0 END AS heritage_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL case for text options', function (done) {
    let statement = optionCase(
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
    let expected = 'CASE WHEN upper(ofsted.uprn) = upper(\'good\') THEN 0 WHEN upper(ofsted.uprn) = upper(\'average\') THEN 5 WHEN upper(ofsted.uprn) = upper(\'bad\') THEN 8 ELSE 0 END AS ofsted_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL statement for a constant value', function (done) {
    let statement = constantCase(
      'usage',
      {
        'type': 'constant',
        'score': 8
      },
      'test',
      'usage',
      'uprn'
    )
    let expected = '8 as usage_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should generate an SQL view statement for manually entered options', function (done) {
    let statement = generateView({
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
    let expected = 'CREATE OR REPLACE VIEW test.factory_scores AS SELECT scores.uprn,scores.address_label,scores.usage_score,scores.food_standards_score,scores.usage_score+scores.food_standards_score as risk_score FROM (SELECT g.uprn,g.address_label as address_label,10 as usage_score,CASE WHEN food_table.rating BETWEEN 0 AND 2 THEN 8 WHEN food_table.rating BETWEEN 3 AND 4 THEN 6 WHEN food_table.rating = 5 THEN 2 ELSE 0 END AS food_standards_score FROM test.gazetteer g  LEFT JOIN test.food_table food_table ON food_table.uprn = g.uprn  JOIN test.ranking_uprns rank ON rank.uprn = g.uprn WHERE rank.ranking_name = \'factory\'::text ) scores'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should execute the generated view statement', function (done) {
    client.query(viewSQL['test_factory'], (err) => {
      done(err)
    })
  })

  it('should ensure the generated view holds the correct data', function (done) {
    client.query(
      'select * from test.factory_scores',
      function (err, result) {
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
          expect(result.rows[3]).to.eql({
            uprn: '4',
            address_label: '4 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 6,
            heritage_score: 2,
            risk_score: 24
          })
          expect(result.rows[4]).to.eql({
            uprn: '5',
            address_label: '5 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 16,
            heritage_score: 0,
            risk_score: 32
          })
          expect(result.rows[5]).to.eql({
            uprn: '6',
            address_label: '6 abc lane',
            usage_score: 8,
            food_standards_score: 2,
            incidents_score: 0,
            heritage_score: 0,
            risk_score: 10
          })
          done()
        }
      }
    )
  })

  it('should check the data in the statistics model', function (done) {
    statsModel.find({})
      .then(result => {
        expect(result[0].category).to.eql('factory')
        expect(result[0].count).to.eql(6)
        expect(result[0].mean).to.eql('22.33')
        expect(result[0].median).to.eql('21.00')
        expect(result[0].variance).to.eql('73.89')
        expect(result[0].stdev).to.eql('8.60')
        expect(result[0].ranges).to.eql({
          veryLow: {lowerBound: 0, upperBound: '13.74', exponent: '-0.00088'},
          veryHigh: {lowerBound: '30.94', upperBound: 34, exponent: '-0.0075'},
          medium: {lowerBound: '13.75', upperBound: '30.93', exponent: '-0.0004'}
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should check the data in ranking model', function (done) {
    rankingModel.find({})
      .then(result => {
        expect(result[0].uprn).to.eql('1')
        expect(result[0].range).to.eql('very-high')
        expect(result[0].distribution).to.eql('0.0185')
        expect(result[0].growthCurve).to.eql('0.42710')

        expect(result[1].uprn).to.eql('2')
        expect(result[1].range).to.eql('medium')
        expect(result[1].distribution).to.eql('0.0409')
        expect(result[1].growthCurve).to.eql('0.22231')

        expect(result[2].uprn).to.eql('3')
        expect(result[2].range).to.eql('medium')
        expect(result[2].distribution).to.eql('0.0354')
        expect(result[2].growthCurve).to.eql('0.19996')

        expect(result[3].uprn).to.eql('4')
        expect(result[3].range).to.eql('medium')
        expect(result[3].distribution).to.eql('0.0455')
        expect(result[3].growthCurve).to.eql('0.29303')

        expect(result[4].uprn).to.eql('5')
        expect(result[4].range).to.eql('very-high')
        expect(result[4].distribution).to.eql('0.0247')
        expect(result[4].growthCurve).to.eql('0.70401')

        expect(result[5].uprn).to.eql('6')
        expect(result[5].range).to.eql('very-low')
        expect(result[5].distribution).to.eql('0.0166')
        expect(result[5].growthCurve).to.eql(null)
        done()
      })
      .catch(err => done(err))
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
