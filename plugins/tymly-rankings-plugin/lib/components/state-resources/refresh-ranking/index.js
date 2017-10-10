'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.propertyType = resourceConfig.propertyType
    this.rankings = env.blueprintComponents.rankings
    this.client = env.bootedServices.storage.client
    this.registrys = env.bootedServices.registry.registry
    callback(null)
  }

  run (event, context) {
    const schema = context.stateMachineMeta.namespace
    const key = schema + '_' + this.propertyType // e.g. test_factory

    // registry is the thing that's being updated by the user in this state
    // so it could come from either resourceConfig or event
    // unless the UI allows the user to update the registry-keys in the DB directly

    let statement = generateView({
      'propertyType': this.propertyType,
      'schema': schema,
      'source': this.rankings[key].source,
      'ranking': this.rankings[key].factors,
      'registry': this.registrys[key]
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
