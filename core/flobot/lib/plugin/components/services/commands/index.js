'use strict'

class CommandsService {
  boot (options, callback) {
    this.commands = options.pluginComponents.commands || {}
    callback(null)
  }
}

module.exports = {
  serviceClass: CommandsService
}
