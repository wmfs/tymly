/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const booleanCase = require('./../lib/components/services/rankings/case-statements/boolean.js')
const optionCase = require('./../lib/components/services/rankings/case-statements/option.js')
const constantCase = require('./../lib/components/services/rankings/case-statements/constant.js')
const generateView = require('./../lib/components/services/rankings/generate-view-statement.js')

describe('Tests the Ranking Service', function () {
  this.timeout(5000)

  let client

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
        client = tymlyServices.storage.client
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
            'value': 5,
            'score': 2
          }
        ]
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
    let statement = booleanCase(
      'heritage',
      {
        'type': 'boolean',
        'operator': 'equals',
        'value': 'Y',
        'true-score': 2,
        'false-score': 0
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
            'value': 'good',
            'score': 0
          },
          {
            'type': 'text-constant',
            'value': 'average',
            'score': 5
          },
          {
            'type': 'text-constant',
            'value': 'bad',
            'score': 8
          }
        ]
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
        'value': 8
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
      'propertyType': 'factory',
      'schema': 'test',
      'source': {
        'model': 'gazetteer',
        'property': 'uprn',
        'otherProperties': [ 'address_label' ]
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
            'value': 10
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
                'value': 5,
                'score': 2
              }
            ]
          }
        }
      }
    })
    let expected = 'CREATE OR REPLACE VIEW test.factory_scores AS SELECT scores.uprn,scores.address_label,scores.usage_score,scores.food_standards_score,scores.usage_score+scores.food_standards_score as risk_score FROM (SELECT g.uprn,g.address_label as address_label,10 as usage_score,CASE WHEN food_table.rating BETWEEN 0 AND 2 THEN 8 WHEN food_table.rating BETWEEN 3 AND 4 THEN 6 WHEN food_table.rating = 5 THEN 2 ELSE 0 END AS food_standards_score FROM test.gazetteer g  LEFT JOIN test.food_table food_table ON food_table.uprn = g.uprn  JOIN test.ranking_uprns rank ON rank.uprn = g.uprn WHERE rank.ranking_name = \'factory\'::text ) scores'
    expect(statement.trim()).to.eql(expected)
    done()
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

  it('should execute the generated view statement', function (done) {
    // TODO: This should run the service based on the /fixtures/blueprint rather than hardcoded the statement produced by it
    client.query(
      'CREATE OR REPLACE VIEW test.factory_scores AS SELECT scores.uprn,scores.label,scores.usage_score,scores.food_standards_score,scores.incidents_score,scores.heritage_score,scores.usage_score+scores.food_standards_score+scores.incidents_score+scores.heritage_score as risk_score FROM (SELECT g.uprn,g.address_label as label,8 as usage_score ,CASE WHEN food.rating BETWEEN 0 AND 2 THEN 8 WHEN food.rating BETWEEN 3 AND 4 THEN 6 WHEN food.rating = 5 THEN 2 ELSE 0 END AS food_standards_score ,CASE WHEN incidents.amount = 0 THEN 0 WHEN incidents.amount = 1 THEN 6 WHEN incidents.amount > 1 THEN 16 ELSE 0 END AS incidents_score ,CASE WHEN (SELECT COUNT(*) FROM test.heritage where uprn = g.uprn) > 0 THEN 2 ELSE 0 END AS heritage_score  FROM test.gazetteer g  LEFT JOIN test.food food ON food.uprn = g.uprn  LEFT JOIN test.incidents incidents ON incidents.uprn = g.uprn  LEFT JOIN test.heritage heritage ON heritage.uprn = g.uprn  JOIN test.ranking_uprns rank ON rank.uprn = g.uprn WHERE rank.ranking_name = \'factory\'::text ) scores;',
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

  it('should ensure the generated view holds the correct data', function (done) {
    client.query(
      'select * from test.factory_scores',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows[0]).to.eql({
            uprn: '1',
            label: '1 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 16,
            heritage_score: 2,
            risk_score: 34
          })
          expect(result.rows[1]).to.eql({
            uprn: '2',
            label: '2 abc lane',
            usage_score: 8,
            food_standards_score: 8,
            incidents_score: 0,
            heritage_score: 2,
            risk_score: 18
          })
          expect(result.rows[2]).to.eql({
            uprn: '3',
            label: '3 abc lane',
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
