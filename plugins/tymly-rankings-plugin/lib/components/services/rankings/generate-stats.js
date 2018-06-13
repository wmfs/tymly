'use strict'

const _ = require('lodash')
const stats = require('stats-lite')
const dist = require('distributions')
const moment = require('moment')
const calculateNewRiskScore = require('./calculate-new-risk-score')
const debug = require('debug')('tymly-rankings-plugin')

module.exports = async function generateStats (options, callback) {
  debug(options.category + ' - Generating statistics')

  const result = await getScores(options)
  const scores = result.rows.map(r => {
    return {
      uprn: r.uprn,
      updated: r.updated_risk_score,
      original: r.original_risk_score
    }
  })

  // todo: should the stats be calculated on original scores or the most recent scores (updated > original)
  // todo: because it changes every iteration if we base it on most recent... invalid!!
  const origScores = scores.map(s => s.original) // scores.map(s => s.updated || s.original)

  if (scores.length > 0) {
    // Generate stats based on most recent scores
    const mean = stats.mean(origScores)
    const stdev = stats.stdev(origScores)

    // Calculate the range boundaries
    const ranges = generateRanges(origScores, mean, stdev)

    const fsRanges = options.registry.value.exponent

    for (let s of scores) {
      const mostRecent = s.updated || s.original

      // Find this property's risk range
      const range = findRange(ranges, mostRecent)

      // Generate stats for this property
      const normal = dist.Normal(mean, stdev)
      const distribution = normal.pdf(mostRecent).toFixed(4)

      const row = await options.rankingModel.findById(s.uprn)

      const growthCurve = row.lastAuditDate && row.fsManagement
        ? calculateGrowthCurve(fsRanges[row.fsManagement], row.lastAuditDate, s.original).toFixed(5)
        : null

      const updatedRiskScore = growthCurve
        ? calculateNewRiskScore(row.fsManagement, s.original, growthCurve, mean, stdev)
        : null

      await options.rankingModel.upsert({
        [options.pk]: s[_.snakeCase(options.pk)],
        rankingName: _.kebabCase(options.category),
        range: _.kebabCase(range),
        distribution: distribution,
        growthCurve: growthCurve,
        updatedRiskScore: updatedRiskScore,
        originalRiskScore: s.original
      }, {
        setMissingPropertiesToNull: false
      })
    }

    const updatedMean = stats.mean(origScores)
    const updatedStdev = stats.stdev(origScores)
    const updatedRanges = generateRanges(origScores, updatedMean, updatedStdev)

    await options.statsModel.upsert({
      category: _.kebabCase(options.category),
      count: origScores.length,
      mean: updatedMean.toFixed(2),
      median: stats.median(origScores).toFixed(2),
      variance: stats.variance(origScores).toFixed(2),
      stdev: updatedStdev.toFixed(2),
      ranges: JSON.stringify(updatedRanges)
    }, {})
  } else {
    debug(options.category + ' - No scores found')
  }

  callback(null)
}

function calculateGrowthCurve (exp, date, riskScore) {
  const daysSince = moment().diff(date, 'days')
  const expression = Math.exp(exp * daysSince)
  const denominator = 1 + (81 * expression)

  debug(`Calculating growth curve: ${riskScore} / ( 1 + ( 81 * ( e ^ ( ${daysSince} * ${exp} ) ) ) ) = ${riskScore / denominator}`)

  return riskScore / denominator
}

function generateRanges (scores, mean, stdev) {
  if (scores.length > 10000) {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: +(mean - (2 * stdev)).toFixed(2)
      },
      low: {
        lowerBound: +(mean - (2 * stdev) + 0.01).toFixed(2),
        upperBound: +(mean - stdev).toFixed(2)
      },
      medium: {
        lowerBound: +(mean - stdev + 0.01).toFixed(2),
        upperBound: +(mean + stdev).toFixed(2)
      },
      high: {
        lowerBound: +(mean + stdev + 0.01).toFixed(2),
        upperBound: +(mean + (2 * stdev)).toFixed(2)
      },
      veryHigh: {
        lowerBound: +(mean + (2 * stdev) + 0.01).toFixed(2),
        upperBound: Math.max(...scores)
      }
    }
  } else {
    return {
      veryLow: {
        lowerBound: 0,
        upperBound: +(mean - stdev).toFixed(2)
      },
      medium: {
        lowerBound: +(mean - stdev + 0.01).toFixed(2),
        upperBound: +(mean + stdev).toFixed(2)
      },
      veryHigh: {
        lowerBound: +(mean + stdev + 0.01).toFixed(2),
        upperBound: Math.max(...scores)
      }
    }
  }
}

function findRange (ranges, score) {
  for (const k of Object.keys(ranges)) {
    if (+score >= +ranges[k].lowerBound && +score <= +ranges[k].upperBound) {
      return k
    }
  }
}

function getScores (options) {
  return options.client.query(`SELECT ${_.snakeCase(options.pk)}, original_risk_score::float, updated_risk_score::float FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`)
}
