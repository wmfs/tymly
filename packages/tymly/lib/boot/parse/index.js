const orderBootSequence = require('./order-boot-sequence')

module.exports = function serviceParser (blueprintComponents, pluginComponents, messages) {
  messages.heading('Parsing')
  return orderBootSequence(pluginComponents.services, messages)
}
