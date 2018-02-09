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
  mean = stats.mean(scores)
  stdev = stats.stdev(scores)

  if (scores.length > 0) {
    ranges = generateRanges(scores, mean, stdev)
    await options.client.query(generateStatsSQL(options, scores, mean, stdev, ranges))
    const res = await options.client.query(getViewRowsSQL(options))

    async.eachSeries(res.rows, (r, cb) => {
      let range = findRange(ranges, r.risk_score)
      let normal = dist.Normal(mean, stdev)
      let distribution = normal.pdf(r.risk_score).toFixed(4)

      options.client.query(updateRangeSQL(options, range, r, distribution))
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

function generateRanges (scores, mean, stdev) {
  if (scores.length > 10000) {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: (+mean - (2 * +stdev)).toFixed(2)
      },
      low: {
        lowerBound: (+mean - (2 * +stdev) + +0.01).toFixed(2),
        upperBound: (+mean - +stdev).toFixed(2)
      },
      medium: {
        lowerBound: (+mean - +stdev + +0.01).toFixed(2),
        upperBound: (+mean + +stdev).toFixed(2)
      },
      high: {
        lowerBound: (+mean + +stdev + +0.01).toFixed(2),
        upperBound: (+mean + (2 * +stdev)).toFixed(2)
      },
      veryHigh: {
        lowerBound: (+mean + (2 * +stdev) + +0.01).toFixed(2),
        upperBound: Math.max(...scores)
      }
    }
  } else {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: (+mean - +stdev).toFixed(2)
      },
      medium: {
        lowerBound: (+mean - +stdev + +0.01).toFixed(2),
        upperBound: (+mean + +stdev).toFixed(2)
      },
      veryHigh: {
        lowerBound: (+mean + +stdev + +0.01).toFixed(2),
        upperBound: Math.max(...scores)
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
  // TODO: 'risk' in risk_score should be inferred
  return `SELECT risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`
}

function getViewRowsSQL (options) {
  return `SELECT ${_.snakeCase(options.pk)}, risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`
}

function updateRangeSQL (options, range, row, distribution) {
  return `CREATE TABLE IF NOT EXISTS ${_.snakeCase(options.schema)}.${_.snakeCase(options.pk)}_to_range 
  (${_.snakeCase(options.pk)} bigint not null primary key, range text, distribution numeric);
  INSERT INTO ${_.snakeCase(options.schema)}.${_.snakeCase(options.pk)}_to_range (${_.snakeCase(options.pk)}, range, distribution)
  VALUES (${row[_.snakeCase(options.pk)]}, '${_.kebabCase(range)}', ${distribution})
  ON CONFLICT (${_.snakeCase(options.pk)}) DO UPDATE SET
  range = '${_.kebabCase(range)}',
  distribution = ${distribution};`
}

function generateStatsSQL (options, scores, mean, stdev, ranges) {
  return `CREATE TABLE IF NOT EXISTS ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats
  (category text not null primary key, count numeric, mean numeric, median numeric, variance numeric, stdev numeric, ranges jsonb);
  INSERT INTO ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats (category, count, mean, median, variance, stdev, ranges)
  VALUES ('${_.kebabCase(options.category)}', ${scores.length}, ${mean.toFixed(2)}, ${stats.median(scores).toFixed(2)},
  ${stats.variance(scores).toFixed(2)}, ${stdev.toFixed(2)}, '${JSON.stringify(ranges)}')
  ON CONFLICT (category) DO UPDATE SET
  count = ${scores.length},
  mean = ${mean.toFixed(2)},
  median = ${stats.median(scores).toFixed(2)},
  variance = ${stats.variance(scores).toFixed(2)},
  stdev = ${stdev.toFixed(2)},
  ranges = '${JSON.stringify(ranges)}';`
}
