'use strict'
const messages = require('./../../startup-messages/index')
const async = require('async')

module.exports = function serviceBoot (options, callback) {
  //  Options
  //  parsedServices
  //  pluginComponents
  //  blueprintComponents
  //  config,

  messages.heading('Booting')

  const bootedServices = {}

  const config = options.config || {}

  async.eachSeries(
    options.parsedServices,

    function boot (serviceComponent, cb) {
      messages.subHeading('Booting ' + serviceComponent.name)
      const ServiceClass = serviceComponent.componentModule.serviceClass
      const service = new ServiceClass()

      bootedServices[serviceComponent.name] = service
      service.boot(
        {
          bootedServices: bootedServices,
          parsedServices: options.parsedServices,
          pluginComponents: options.pluginComponents,
          blueprintComponents: options.blueprintComponents,
          pluginPaths: options.pluginPaths,
          blueprintPaths: options.blueprintPaths,
          config: config,
          messages: messages
        },
        cb
      )
    },

    function (err) {
      if (err) {
        messages.error(err)
        messages.showErrors('booting')
        callback(err)
      } else {
        messages.showAnyWarnings('booting')
        callback(null, bootedServices)
      }
    }
  )
}
