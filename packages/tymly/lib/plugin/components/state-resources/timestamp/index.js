
module.exports = class Timestamp {
  init (resourceConfig, env, callback) {
    this.timestamp = env.bootedServices.timestamp

    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess({ timestamp: this.timestamp.now() })
  } // run
} // GetRegistryKey
