'use strict'

const dottie = require('dottie')
const _ = require('lodash')
const util = require('util')

const State = require('./State')

class StatesService {

  boot (options, callback) {
    this.states = {}

    let state
    const states = dottie.get(options, 'pluginComponents.states')

    if (states) {
      for (let stateId in states) {
        if (states.hasOwnProperty(stateId)) {
          state = states[stateId]
          util.inherits(state.componentModule.stateClass, State)
          this.states[stateId] = state
        }
      }
    }

    const stateIds = _.keys(this.states)
    stateIds.forEach(
      function (stateId) {
        options.messages.info(stateId)
      }
    )

    callback(null)
  }
}

module.exports = {
  serviceClass: StatesService
}
