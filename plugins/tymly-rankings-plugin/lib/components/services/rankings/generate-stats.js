'use strict'

const _ = require('lodash')
const stats = require('stats-lite')
const buildRanges = require('./build-ranges')
const calculateNewRiskScore = require('./calculate-new-risk-score')
const projectedRecoveryDates = require('./projected-recovery-dates')
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
      original: r.original_risk_score
    }
  })

  return scores
} // loadRiskScores

async function calculateDistribution (scores, options) {
  const origScores = scores.map(s => s.original)
  // Generate stats based on most recent scores
  const mean = stats.mean(origScores)
  const stdev = stats.stdev(origScores)
  const ranges = buildRanges(origScores, mean, stdev)

  await saveStats(origScores, mean, stdev, ranges, options)

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
  return options.client.query(`SELECT ${_.snakeCase(options.pk)}, original_risk_score::float FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`)
}

async function moveCalculatedRiskScoresAlongGrowthCurve (scores, mean, stdev, ranges, fsRanges, options) {
  for (const s of scores) {
    const row = await options.rankingModel.findById(s.uprn)

    if (!(row.lastAuditDate && row.fsManagement)) { await setRankingFromOriginalScore(s, ranges, options) } else { await moveAlongGrowthCurve(s, row, mean, stdev, ranges, fsRanges, options) }
  }
} // moveCalculatedRiskScoresAlongGrowthCurve

async function setRankingFromOriginalScore (score, ranges, options) {
  const range = ranges.find(score.original)

  await options.rankingModel.upsert({
    [options.pk]: score[_.snakeCase(options.pk)],
    rankingName: _.kebabCase(options.category),
    range: _.kebabCase(range)
  }, {
    setMissingPropertiesToNull: false
  })
} // setRankingFromOriginalScore

async function moveAlongGrowthCurve (score, row, mean, stdev, ranges, fsRanges, options) {
  const daysSinceAudit = options.timestamp.today().diff(row.lastAuditDate, 'days')
  const exp = fsRanges[row.fsManagement]

  const originalRange = ranges.find(score.original)
  const crs = calculateNewRiskScore(
    score.original,
    originalRange,
    daysSinceAudit,
    mean,
    stdev,
    exp
  ) // updatedRiskScore

  const updatedRiskScore = toTwoDp(crs)
  const newRange = ranges.find(updatedRiskScore)

  const { projectedHighRiskDate, projectedReturnDate } = projectedRecoveryDates(
    score.original,
    originalRange,
    ranges,
    daysSinceAudit,
    mean,
    stdev,
    exp,
    options.timestamp.today()
  )

  await options.rankingModel.upsert({
    [options.pk]: score[_.snakeCase(options.pk)],
    rankingName: _.kebabCase(options.category),
    range: _.kebabCase(newRange),
    updatedRiskScore: updatedRiskScore,
    projectedHighRiskCrossover: projectedHighRiskDate,
    projectedReturnToOriginal: projectedReturnDate
  }, {
    setMissingPropertiesToNull: false
  })
} // moveAlongGrowthCurve
