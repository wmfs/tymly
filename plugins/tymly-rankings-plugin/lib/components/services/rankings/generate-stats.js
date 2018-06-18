'use strict'

const _ = require('lodash')
const stats = require('stats-lite')
const dist = require('distributions')
const moment = require('moment')
const buildRanges = require('./build-ranges')
const calculateNewRiskScore = require('./calculate-new-risk-score')
const calculateGrowthCurve = require('./calculate-growth-curve')
const debug = require('debug')('tymly-rankings-plugin')
const toTwoDp = require('./to-two-dp')

module.exports = async function generateStats (options, callback) {
  debug(options.category + ' - Generating statistics')

  const scores = await loadRiskScores(options)

  if (scores.length === 0) {
    debug(options.category + ' - No scores found')
  } // if ...

  const { mean, stdev, ranges } = await calculateDistribution(scores, options)
  const fsRanges = options.registry.value.exponent

  await moveCalculatedRiskScoresAlongGrowthCurve(scores, mean, stdev, ranges, fsRanges, options)

  callback(null)
} // generateStats

async function loadRiskScores (options) {
  const result = await getScores(options)
  const scores = result.rows.map(r => {
    return {
      uprn: r.uprn,
      updated: +r.updated_risk_score,
      original: +r.original_risk_score
    }
  })

  return scores;
} // loadRiskScores

async function calculateDistribution (scores, options) {
  const origScores = scores.map(s => s.original)
  // Generate stats based on most recent scores
  const mean = stats.mean(origScores)
  const stdev = stats.stdev(origScores)
  const ranges = buildRanges(origScores, mean, stdev)

  await saveStats (scores, mean, stdev, ranges, options)

  return {
    mean,
    stdev,
    ranges
  }
} // calculateDistribution

async function saveStats (scores, mean, stdev, ranges, options) {
  await options.statsModel.upsert({
    category: _.kebabCase(options.category),
    count: scores.length,
    mean: toTwoDp(mean),
    median: toTwoDp(stats.median(scores)),
    variance: toTwoDp(stats.variance(scores)),
    stdev: toTwoDp(stdev),
    ranges: ranges
  },
  {})
} // saveStats

function getScores (options) {
  return options.client.query(`SELECT ${_.snakeCase(options.pk)}, original_risk_score::float, updated_risk_score::float FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`)
}

async function moveCalculatedRiskScoresAlongGrowthCurve (scores, mean, stdev, ranges, fsRanges, options) {
  for (const [idx, s] of scores.entries()) {
    const mostRecent = s.updated || s.original

    // Generate stats for this property
    const normal = dist.Normal(mean, stdev)
    const distribution = normal.pdf(mostRecent).toFixed(4)

    const row = await options.rankingModel.findById(s.uprn)

    const daysSinceAudit = row.lastAuditDate
      ? moment().diff(row.lastAuditDate, 'days')
      : null

    const growthCurve = row.lastAuditDate && row.fsManagement
      ? +calculateGrowthCurve(fsRanges[row.fsManagement], daysSinceAudit, s.original).toFixed(5)
      : null

    const updatedRiskScore = growthCurve
      ? calculateNewRiskScore(row.fsManagement, s.original, growthCurve, mean, stdev)
      : null

    if (updatedRiskScore) scores[idx].updated = updatedRiskScore

    const range = updatedRiskScore
      ? ranges.find(updatedRiskScore)
      : ranges.find(mostRecent)

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


} // updateCalculatedGrowthCurves