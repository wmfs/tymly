'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.rankings = env.blueprintComponents.rankings
    this.client = env.bootedServices.storage.client
    this.registry = env.bootedServices.registry
    callback(null)
  }

  async run (event, context) {
    const schema = event.schema
    const category = event.category
    const key = schema + '_' + category
    const statement = generateView({
      category: category,
      schema: schema,
      source: this.rankings[key].source,
      ranking: this.rankings[key].factors,
      registry: {
        value: this.registry.get(key)
      }
    })

    await this.client.query(statement)
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({error: 'generateViewFail', cause: err}))
  }
}

module.exports = RefreshRanking
