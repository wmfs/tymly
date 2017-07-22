'use strict'
const messages = require('./../../startup-messages')

const orderBootSequence = require('./order-boot-sequence')

module.exports = function serviceParser (blueprintComponents, pluginComponents, config) {
  messages.heading('Parsing')
  return orderBootSequence(pluginComponents.services)
}
