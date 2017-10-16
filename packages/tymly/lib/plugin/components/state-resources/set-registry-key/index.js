'use strict'

module.exports = class SetRegistryKey {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    callback(null)
  }

  run (event, context) {
    this.key = event.key
    this.value = event.value

    this.registry.set(this.key, this.value, function (err) {
      if (err) {
        context.sendTaskFailure(
          {
            error: 'SetRegistryKeyFail',
            cause: err
          }
        )
      } else {
        context.sendTaskSuccess()
      }
    })
  }
}
