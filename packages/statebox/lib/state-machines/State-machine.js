'use strict'
const debug = require('debug')('statebox')
const stateTypes = require('./state-types')
const _ = require('lodash')
const async = require('async')
const boom = require('boom')

class StateMachine {

  init (stateMachineName, definition, env, options, callback) {
    const _this = this
    this.name = stateMachineName
    this.definition = definition
    this.startAt = definition.StartAt
    this.states = {}
    this.options = options
    debug(`Creating '${stateMachineName}' stateMachine (${definition.Comment || 'No stateMachine comment specified'})`)

    async.eachOf(
      definition.States,
      function (stateDefinition, stateName, cb) {
        const State = stateTypes[stateDefinition.Type]
        const state = new State(stateName, _this, stateDefinition, options)
        if (_.isFunction(state.stateTypeInit)) {
          state.stateTypeInit(
            env,
            function (err) {
              if (err) {
                cb(err)
              } else {
                _this.states[stateName] = state
                cb()
              }
            }
          )
        } else {
          _this.states[stateName] = state
          cb()
        }
      },
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    )
  }

  findStateDefinitionByName (name) {
    const state = this.states[name]
    if (state) {
      return state.definition
    }
  }

  processState (executionName) {
    const _this = this
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Need to handle errors as per spec!
          throw (err)
        } else {
          const stateNameToRun = executionDescription.currentStateName
          const stateToRun = _this.states[stateNameToRun]
          if (stateToRun) {
            debug(`About to process ${stateToRun.stateType} '${stateNameToRun}' in stateMachine '${_this.name}' stateMachine (executionName='${executionName}')`)
            // TODO: Why, if no .process method is defined, does this intermittently not throw an error? Mocha in IDE?
            stateToRun.process(executionDescription)
          } else {
            // TODO: Need to handle trying to run an unknown state (should be picked-up in validation though)
            throw (boom.badRequest(`Unknown state '${stateNameToRun}' in stateMachine '${_this.name}'`))
          }
        }
      }
    )
  }
}

module.exports = StateMachine
