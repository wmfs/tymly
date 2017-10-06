/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const numericCase = require('./../lib/components/services/rankings/case-statements/numeric.js')
const booleanCase = require('./../lib/components/services/rankings/case-statements/boolean.js')
const optionsCase = require('./../lib/components/services/rankings/case-statements/options.js')
const constantCase = require('./../lib/components/services/rankings/case-statements/constant.js')
const generateView = require('./../lib/components/services/rankings/generate-view-statement.js')

describe('Ridge blueprint', function () {
  this.timeout(5000)

  it('should run the tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprint')
        ]
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should test numeric case statement', function (done) {
    let statement = numericCase(
      'foodStandards',
      {
        'type': 'numerical',
        'ranges': [
          {
            'minimum': 0,
            'maximum': 2,
            'score': 8
          },
          {
            'minimum': 3,
            'maximum': 4,
            'score': 6
          },
          {
            'equals': 5,
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

  it('should test boolean case statement', function (done) {
    let statement = booleanCase(
      'heritage',
      {
        'type': 'boolean',
        'trueScore': 2
      },
      'test',
      'heritage',
      'uprn'
    )
    let expected = 'CASE WHEN (SELECT COUNT(*) FROM test.heritage where uprn = g.uprn) > 0 THEN 2 ELSE 0 END AS heritage_score'
    expect(statement.trim()).to.eql(expected)
    done()
  })

  it('should test options case statement', function (done) {
    let statement = optionsCase(
      'ofsted',
      {
        'type': 'options',
        'ranges': [
          {
            'option': 'good',
            'score': 0
          },
          {
            'option': 'average',
            'score': 5
          },
          {
            'option': 'bad',
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

  it('should test constant case statement', function (done) {
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

  it('should test the view statement', function (done) {
    let statement = generateView({
      'propertyType': 'factory',
      'schema': 'test',
      'tableToMatch': 'gazetteer',
      'columnToMatch': 'uprn',
      'ranking': {
        'usage': 'constant',
        'foodStandards': {
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
            'type': 'numerical',
            'ranges': [
              {
                'minimum': 0,
                'maximum': 2,
                'score': 8
              },
              {
                'minimum': 3,
                'maximum': 4,
                'score': 6
              },
              {
                'equals': 5,
                'score': 2
              }
            ]
          }
        }
      }
    })
    let expected = 'CREATE OR REPLACE VIEW test.factory_scores AS ' +
      'SELECT scores.uprn,scores.label,scores.usage_score,scores.food_standards_score,scores.usage_score+scores.food_standards_score as risk_score ' +
      'FROM (' +
      'SELECT ' +
      'g.uprn,' +
      'g.address_label as label,' +
      '10 as usage_score ,' +
      'CASE WHEN food_table.rating BETWEEN 0 AND 2 THEN 8 WHEN food_table.rating BETWEEN 3 AND 4 THEN 6 WHEN food_table.rating = 5 THEN 2 ELSE 0 END AS food_standards_score  ' +
      'FROM test.undefined g  ' +
      'JOIN test.food_table food_table ON food_table.uprn = g.uprn  ' +
      'JOIN test.ranking_uprns rank ON rank.uprn ' +
      'WHERE rank.ranking_name = \'factory\'::text ) scores'
    expect(statement.trim()).to.eql(expected)
    done()
  })
})
