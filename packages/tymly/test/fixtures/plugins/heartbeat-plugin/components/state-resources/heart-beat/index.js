
class Heartbeat {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context, done) {
    const heartbeat = {
      heart: 'ba-dum-dum'
    }

    context.sendTaskHeartbeat(
      {heartbeat},
      (err, executionDescription) => {
        if (err) throw new Error(err)
        done(executionDescription)
      }
    )
  } // run
} // Heartbeat

module.exports = Heartbeat
