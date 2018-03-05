'use strict'

const _ = require('lodash')
const async = require('async')
const stats = require('stats-lite')
const dist = require('distributions')
const debug = require('debug')('tymly-rankings-plugin')

module.exports = async function generateStats (options, callback) {
  debug(options.category + ' - Generating statistics')

  let scores = []
  let ranges, mean, stdev

  const result = await options.client.query(getScoresSQL(options))
  result.rows.map(row => scores.push(row.risk_score))

  if (scores.length > 0) {
    mean = stats.mean(scores)
    stdev = stats.stdev(scores)
    ranges = generateRanges(scores, mean, stdev, options.registry.value.exponent)

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
      let range = findRange(ranges, r.risk_score)
      let normal = dist.Normal(mean, stdev)
      let distribution = normal.pdf(r.risk_score).toFixed(4)

      // calculate the growth curve here and upsert to rankingModel below

      options.rankingModel.upsert({
        [options.pk]: r[_.snakeCase(options.pk)],
        rankingName: options.category,
        range: _.kebabCase(range),
        distribution: distribution
      }, {})
        .then(() => cb(null))
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
