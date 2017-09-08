'use strict'

const Statebox = require('statebox')

class StateMachinesService {
  boot (options, callback) {
    this.statebox = new Statebox()
    callback(null)
  }
}

module.exports = {
  serviceClass: StateMachinesService
}
