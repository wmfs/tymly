'use strict'

const schema = require('./schema.json')
const _ = require('lodash')

class TymlyService {
  boot (options, callback) {
    this.bootedServices = options.bootedServices || {}
    this.orderedServiceNames = options.parsedServices ? options.parsedServices.map(service => { return service.name }) : []
    callback()
  }

  async shutdown () {
    await _.reverse(this.orderedServiceNames).map(service => {
      if (service !== 'tymly') {
        if (typeof this.bootedServices[service].shutdown === 'function') {
          this.bootedServices[service].shutdown()
        }
      }
    })
  }
}

module.exports = {
  schema: schema,
  serviceClass: TymlyService
}
