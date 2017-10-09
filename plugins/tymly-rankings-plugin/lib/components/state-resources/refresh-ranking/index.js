'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.propertyType = resourceConfig.propertyType
    this.rankings = env.blueprintComponents.rankings
    this.registrys = env.bootedServices.registry.registry
    callback(null)
  }

  run (event, context) {
    const schema = context.stateMachineMeta.namespace // e.g. test
    const key = schema + '_' + this.propertyType // e.g. test_factory

    // registry maybe should come from event.registry
    generateView({
      'propertyType': this.propertyType, // e.g. factory
      'schema': schema,
      'source': this.rankings[key].source,
      'ranking': this.rankings[key].factors,
      'registry': this.registrys[key]
    }) // The function probably needs a callback
    context.sendTaskSuccess()
  }
}

module.exports = RefreshRanking
