'use strict'

const _ = require('lodash')
const async = require('async')
const dottie = require('dottie')

class State {
  stateConstructor (stateConfig, fsmOptions) {
    const _this = this
    const commands = fsmOptions.services.commands.commands

    // TODO: What about arrays?

    function processOptions (rootPath, rootOptions) {
      let keys
      let value
      let path
      let Command
      let commandName

      if (_.isObject(rootOptions)) {
        for (let key in rootOptions) {
          path = rootPath
          if (path === '') {
            path = key
          } else {
            path += '.' + key
          }

          value = rootOptions[key]

          if (_.isObject(value)) {
            keys = _.keys(value)

            if (keys.length === 1 && keys[0][0] === '$') {
              commandName = keys[0].slice(1)
              _this.hasCommands = true

              if (commands.hasOwnProperty(commandName)) {
                Command = commands[commandName].componentModule.commandFunction
                _this.commandsToRun[path] = new Command(_.values(value)[0])
              } else {
                throw new Error("Unknown command '" + commandName + "' referenced in state " + _this._meta.stateId + ' in flow ' + _this._meta.flowId)
              }
            } else {
              // Is an object, but not a command
              dottie.set(_this.options, path, value)
            }

            processOptions(path, value)
          } else {
            // Not an object, so just grab it as a normal option
            dottie.set(_this.options, path, value)
          }
        }
      }
    }

    this.commandsToRun = {}
    this.options = {}
    this.fsmOptions = fsmOptions
    this._meta = stateConfig._meta || {}
    this.hasCommands = false

    processOptions('', stateConfig.options)
  }

  getOptions (flobot, callback) {
    if (this.hasCommands) {
      const resolvedOptions = JSON.parse(JSON.stringify(this.options))

      // There are some commands in-play

      async.eachOfSeries(
        this.commandsToRun,
        function (service, path, cb) {
          service.run(flobot, function (err, output) {
            if (err) {
              cb(err)
            } else {
              dottie.set(resolvedOptions, path, output)
              cb(null)
            }
          })
        },
        function (err) {
          if (err) {
            callback(err)
          } else {
            callback(null, resolvedOptions)
          }
        }
      )
    } else {
      // No commands in-play, just send back options
      callback(null, this.options)
    }
  }
}

module.exports = State
