'use strict'

const schema = require('./schema.json')
class Logging {

  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    this.getOptions(
      flobot,
      function (err, options) {
        if (err) {
          callback(
            {
              name: 'options',
              message: "Failed to derive runtime options in 'logging' state",
              body: err
            })
        } else {
          // TODO: Use Winston or something better.
          console.log(options.text)
        }
      }
    )
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Logging,
  schema: schema
}
