'use strict'

class GetUserDashboardData {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}

module.exports = GetUserDashboardData
