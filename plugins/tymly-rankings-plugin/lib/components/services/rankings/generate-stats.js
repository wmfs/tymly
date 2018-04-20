'use strict'

const _ = require('lodash')
const async = require('async')
const stats = require('stats-lite')
const dist = require('distributions')
const moment = require('moment')
const calculateNewRiskScore = require('./calculate-new-risk-score')
const debug = require('debug')('tymly-rankings-plugin')

module.exports = async function generateStats (options, callback) {
  debug(options.category + ' - Generating statistics')

  const result = await options.client.query(getScoresSQL(options))
  const scores = result.rows.map(row => row.risk_score)

  if (scores.length > 0) {
    const mean = stats.mean(scores)
    const stdev = stats.stdev(scores)
    const ranges = generateRanges(scores, mean, stdev, options.registry.value.exponent)

    await options.statsModel.upsert({
      category: _.kebabCase(options.category),
      count: scores.length,
      mean: mean.toFixed(2),
      median: stats.median(scores).toFixed(2),
      variance: stats.variance(scores).toFixed(2),
      stdev: stdev.toFixed(2),
      ranges: JSON.stringify(ranges)
    }, {})

    const res = await options.client.query(getViewRowsSQL(options))

    async.eachSeries(res.rows, (r, cb) => {
      const range = findRange(ranges, r.risk_score)
      const normal = dist.Normal(mean, stdev)
      const distribution = normal.pdf(r.risk_score).toFixed(4)

      options.rankingModel.findById(r.uprn)
        .then(row => {
          const growthCurve = row.lastAuditDate ? calculateGrowthCurve(ranges[range].exponent, row.lastAuditDate, r.risk_score).toFixed(5) : null
          const updatedRiskScore = growthCurve ? calculateNewRiskScore(range, r.risk_score, growthCurve, mean, stdev) : null

          options.rankingModel.upsert({
            [options.pk]: r[_.snakeCase(options.pk)],
            rankingName: _.kebabCase(options.category),
            range: _.kebabCase(range),
            distribution: distribution,
            growthCurve: growthCurve,
            updatedRiskScore: updatedRiskScore
          }, {
            setMissingPropertiesToNull: false
          })
            .then(() => cb(null))
            .catch(err => cb(err))
        })
        .catch(err => cb(err))
    }, (err) => {
      if (err) callback(err)
      debug(options.category + ' - Finished generating statistics')
      callback(null)
    })
  } else {
    debug(options.category + ' - No scores found')
    callback(null)
  }
}

function calculateGrowthCurve (exp, date, riskScore) {
  const daysSince = moment().diff(date, 'days')
  const expression = Math.exp(exp * daysSince)
  const denominator = 1 + (81 * expression)

  debug(`Calculating growth curve: ${riskScore} / ( 1 + ( 81 * ( ${daysSince} ^ ${exp} ) ) ) = ${riskScore / denominator}`)

  return riskScore / denominator
}

function generateRanges (scores, mean, stdev, exponents) {
  if (scores.length > 10000) {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: (+mean - (2 * +stdev)).toFixed(2),
        exponent: exponents.veryLow
      },
      low: {
        lowerBound: (+mean - (2 * +stdev) + +0.01).toFixed(2),
        upperBound: (+mean - +stdev).toFixed(2),
        exponent: exponents.low
      },
      medium: {
        lowerBound: (+mean - +stdev + +0.01).toFixed(2),
        upperBound: (+mean + +stdev).toFixed(2),
        exponent: exponents.medium
      },
      high: {
        lowerBound: (+mean + +stdev + +0.01).toFixed(2),
        upperBound: (+mean + (2 * +stdev)).toFixed(2),
        exponent: exponents.high
      },
      veryHigh: {
        lowerBound: (+mean + (2 * +stdev) + +0.01).toFixed(2),
        upperBound: Math.max(...scores),
        exponent: exponents.veryHigh
      }
    }
  } else {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: (+mean - +stdev).toFixed(2),
        exponent: exponents.veryLow
      },
      medium: {
        lowerBound: (+mean - +stdev + +0.01).toFixed(2),
        upperBound: (+mean + +stdev).toFixed(2),
        exponent: exponents.medium
      },
      veryHigh: {
        lowerBound: (+mean + +stdev + +0.01).toFixed(2),
        upperBound: Math.max(...scores),
        exponent: exponents.veryHigh
      }
    }
  }
}

function findRange (ranges, score) {
  for (const k of Object.keys(ranges)) {
    if (score >= ranges[k].lowerBound && score <= ranges[k].upperBound) {
      return k
    }
  }
}

function getScoresSQL (options) {
  return `SELECT risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`
}

function getViewRowsSQL (options) {
  return `SELECT ${_.snakeCase(options.pk)}, risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`
}
