
module.exports = class Timestamp {
  init (resourceConfig, env, callback) {
    this.timestamp = env.bootedServices.timestamp

    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess(this.timestamp.now())
  } // run
} // GetRegistryKey
