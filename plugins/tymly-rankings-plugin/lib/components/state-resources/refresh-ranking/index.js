'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')
const generateStats = require('./../../services/rankings/generate-stats.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.rankings = env.blueprintComponents.rankings
    this.client = env.bootedServices.storage.client
    this.registry = env.bootedServices.registry
    this.storage = env.bootedServices.storage
    callback(null)
  }

  async run (event, context) {
    const schema = event.schema
    const category = event.category
    const key = schema + '_' + category

    const factors =
      Object.keys(this.rankings[key].factors)
        .filter(factor => Object.keys(this.registry.get(key)).includes(factor))
        .reduce((obj, k) => {
          obj[k] = this.rankings[key].factors[k]
          return obj
        }, {})

    const statement = generateView({
      category: category,
      schema: schema,
      source: this.rankings[key].source,
      ranking: factors,
      registry: {
        value: this.registry.get(key)
      }
    })

    const rankingModel = this.storage.models[`${schema}_${this.rankings[key].rankingModel}`]
    const statsModel = this.storage.models[`${schema}_${this.rankings[key].statsModel}`]

    generateStats({
      client: this.client,
      category: category,
      schema: schema,
      pk: this.rankings[key].source.property,
      name: schema,
      rankingModel: rankingModel,
      statsModel: statsModel,
      registry: this.registry.registry[key]
    }, async (err) => {
      if (err) return context.sendTaskFailure({error: 'generateStatsFail', cause: err})
      await this.client.query(statement)
        .then(() => context.sendTaskSuccess())
        .catch(err => context.sendTaskFailure({error: 'generateViewFail', cause: err}))
    })
  }
}

module.exports = RefreshRanking
