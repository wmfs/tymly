'use strict'

const _ = require('lodash')
const calculateNewRiskScore = require('./../../services/rankings/calculate-new-risk-score.js')

class RefreshRiskScore {
  init (resourceConfig, env, callback) {
    this.rankings = env.blueprintComponents.rankings
    this.storage = env.bootedServices.storage
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  async run (event, context) {
    const uprn = event.uprn
    const schema = event.schema
    const category = event.category
    const key = schema + '_' + category

    const rankingModel = this.storage.models[`${schema}_${this.rankings[key].rankingModel}`]
    const statsModel = this.storage.models[`${schema}_${this.rankings[key].statsModel}`]

    const rankingDoc = await rankingModel.findById(uprn)
    const statsDoc = await statsModel.findById(category)
    const riskScore = await this.client.query(getRiskScoreSQL({
      schema: schema,
      category: category,
      uprn: uprn
    }))

    const updatedRiskScore = calculateNewRiskScore(
      rankingDoc.range,
      riskScore.rows[0].risk_score,
      rankingDoc.growthCurve,
      statsDoc.mean,
      statsDoc.stdev
    )
    context.sendTaskSuccess({updatedRiskScore})
  }
}

function getRiskScoreSQL (options) {
  return `SELECT risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores WHERE uprn = ${options.uprn}`
}

module.exports = RefreshRiskScore
