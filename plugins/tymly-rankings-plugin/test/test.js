/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const numericCase = require('./../lib/components/services/ranking/case-statements/numeric.js')
const booleanCase = require('./../lib/components/services/ranking/case-statements/boolean.js')

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
})
