'use strict'

module.exports = class SetRegistryKey {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    callback(null)
  }

  run (event, context) {
    this.registry.set(event.key, event.value, function (err) {
      if (err) return context.sendTaskFailure({error: 'SetRegistryKeyFail', cause: err})
      context.sendTaskSuccess()
    })
  }
}
