'use strict'

const generateView = require('./../../services/rankings/generate-view-statement.js')

class RefreshRanking {
  init (resourceConfig, env, callback) {
    this.propertyType = resourceConfig.propertyType
    this.schema = 'test' // this should come from where ever the namespace is located

    let key = this.schema + '_' + this.propertyType

    this.source = env.blueprintComponents.rankings[key].source
    this.ranking = env.blueprintComponents.rankings[key].factors
    this.registry = env.bootedServices.registry.registry[key] // this should change to become the user-updated weights, rather than the already stored ones
    callback(null)
  }

  run (event, context) {
    // registry maybe should come from event.registry
    generateView({
      'propertyType': this.propertyType,
      'schema': this.schema,
      'source': this.source,
      'ranking': this.ranking,
      'registry': this.registry
    })
    // The function probably needs a callback
    context.sendTaskSuccess()
  }
}

module.exports = RefreshRanking
