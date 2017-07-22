'use strict'

const _ = require('lodash')

class Starting {

  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    if (_.isObject(data) && !_.isArray(data)) {
      flobot.ctx = _.defaults(data, flobot.ctx)
    }

    callback(null)
  }

  leave (flobot, data, callback) {
    flobot.status = 'running'
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Starting
}
