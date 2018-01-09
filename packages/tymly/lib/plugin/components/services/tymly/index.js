'use strict'

const debug = require('debug')('tymlyService')
const schema = require('./schema.json')
const _ = require('lodash')

class TymlyService {
  boot (options, callback) {
    this.bootedServices = options.bootedServices || {}
    this.orderedServiceNames = options.parsedServices ? options.parsedServices.map(service => { return service.name }) : []
    callback()
  }

  async shutdown () {
    debug('Shutting down...')
    await _.reverse(this.orderedServiceNames).map(service => {
      if (service !== 'tymly') {
        if (typeof this.bootedServices[service].shutdown === 'function') {
          debug(` - ${service} (Shutting down...)`)
          this.bootedServices[service].shutdown()
        } else {
          debug(` - ${service} (Skipped - no shutdown function)`)
        }
      }
    })
    debug(`Shutdown.`)
    Object.keys(require.cache).map(k => { delete require.cache[k] })
  }
}

module.exports = {
  schema: schema,
  serviceClass: TymlyService
}
