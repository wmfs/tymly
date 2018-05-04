
module.exports = class GetRegistryKey {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    callback(null)
  }

  run (event, context) {
    try {
      const value = this.registry.get(event.key) || event.defaultValue

      context.sendTaskSuccess({ registryValue: value })
    } catch (err) {
      if (event.defaultValue) {
        return context.sendTaskSuccess({ registryValue: event.defaultValue })
      } // if ...

      context.sendTaskFailure({ error: 'GetRegistryKeyFail', cause: err })
    } // catch
  } // run
} // GetRegistryKey
