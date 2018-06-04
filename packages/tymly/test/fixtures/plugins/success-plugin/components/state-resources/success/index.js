
class Success {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess('Yes boys!')
  } // run
} // Success

module.exports = Success
