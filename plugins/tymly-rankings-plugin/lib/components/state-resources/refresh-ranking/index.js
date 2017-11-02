'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.rankings = env.blueprintComponents.rankings
    this.client = env.bootedServices.storage.client
    this.registry = env.bootedServices.registry
    callback(null)
  }

  run (event, context) {
    this.schema = event.schema
    this.category = event.category

    // const schema = context.stateMachineMeta.namespace
    const key = this.schema + '_' + this.category

    let statement = generateView({
      category: this.category,
      schema: this.schema,
      source: this.rankings[key].source,
      ranking: this.rankings[key].factors,
      registry: {
        value: this.registry.get(key)
      }
    })

    this.client.query(
      statement,
      function (err) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'generateViewFail',
              cause: err
            }
          )
        } else {
          context.sendTaskSuccess()
        }
      }
    )
  }
}

module.exports = RefreshRanking
