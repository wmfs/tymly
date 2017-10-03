'use strict'

const loader = require('./load')
const serviceParser = require('./parse')
const booter = require('./boot')

const messages = require('./../startup-messages')

module.exports = function bootTymlyServices (options, callback) {
  messages.reset()
  messages.title()

  const loadedComponents = loader(options)

  if (messages.noErrors) {
    const parsedServices = serviceParser(
      loadedComponents.blueprintComponents,
      loadedComponents.pluginComponents
    )

    if (parsedServices) {
      booter(
        {
          parsedServices: parsedServices,
          pluginComponents: loadedComponents.pluginComponents,
          blueprintComponents: loadedComponents.blueprintComponents,
          pluginPaths: loadedComponents.pluginPaths,
          blueprintPaths: loadedComponents.blueprintPaths,
          config: options.config
        },
        callback
      )
    } else {
      messages.showAnyWarnings('parsing')
      messages.showErrors('parsing')
      callback(messages.errors)
    }
  } else {
    messages.showAnyWarnings('loading')
    messages.showErrors('loading')
    callback(messages.errors)
  }
}
