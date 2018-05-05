
module.exports = class SetRegistryKey {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    this.key = resourceConfig.key
    callback(null)
  }

  run (event, context) {
    this.registry.set(this.key, event, function (err) {
      if (err) return context.sendTaskFailure({error: 'SetConfiguredRegistryKeyFail', cause: err})
      context.sendTaskSuccess()
    })
  }
}
