
module.exports = class GetRegistryKey {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    this.key = resourceConfig.key
    callback(null)
  }

  run (event, context) {
    try {
      const value = this.registry.get(this.key) || event.defaultValue

      context.sendTaskSuccess({ registryValue: value })
    } catch (err) {
      if (event.defaultValue) {
        return context.sendTaskSuccess({ registryValue: event.defaultValue })
      } // if ...

      context.sendTaskFailure({ error: 'GetConfiguredRegistryKeyFail', cause: err })
    } // catch
  } // run
} // GetRegistryKey
