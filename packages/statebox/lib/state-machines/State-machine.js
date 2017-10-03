'use strict'
const debug = require('debug')('statebox')
const stateTypes = require('./state-types')
const _ = require('lodash')
const async = require('async')
const boom = require('boom')

class StateMachine {
  init (stateMachineName, definition, stateMachineMeta, env, options, callback) {
    const _this = this
    this.name = stateMachineName
    this.definition = definition
    this.meta = stateMachineMeta
    this.startAt = definition.StartAt
    this.states = {}
    this.options = options
    this.callbackManager = options.callbackManager
    debug(`Creating '${stateMachineName}' stateMachine (${definition.Comment || 'No stateMachine comment specified'})`)

    async.eachOf(
      definition.States,
      function (stateDefinition, stateName, cb) {
        const State = stateTypes[stateDefinition.Type]
        if (State) {
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
        } else {
          cb(boom.badRequest(`Unable to create state machine '${stateMachineName}' - failed to find state-type '${stateDefinition.Type}'. Does state '${stateName}' have a type property set?`))
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

  runState (executionDescription) {
    const _this = this
    const stateNameToRun = executionDescription.currentStateName
    const stateToRun = this.states[stateNameToRun]
    if (stateToRun) {
      debug(`About to process ${stateToRun.stateType} '${stateNameToRun}' in stateMachine '${this.name}' stateMachine (executionName='${executionDescription.executionName}')`)

      const registeredCallback = this.callbackManager.getAndRemoveCallback('ENTERING:' + stateNameToRun, executionDescription.executionName)
      if (registeredCallback) {
        registeredCallback(null, executionDescription)
      }

      if (stateToRun.resourceExpectsDoneCallback) {
        stateToRun.process(
          executionDescription,
          function (postProcessExecutionDescription) {
            // AFTER_RESOURCE_CALLBACK.TYPE:Form-filling
            const resourceName = postProcessExecutionDescription.currentResource.split(':')[1]
            const eventName = 'AFTER_RESOURCE_CALLBACK.TYPE:' + resourceName
            const registeredCallback = _this.callbackManager.getAndRemoveCallback(
              eventName,
              postProcessExecutionDescription.executionName
            )
            if (registeredCallback) {
              registeredCallback(null, postProcessExecutionDescription)
            }
          }
        )
      } else {
        stateToRun.process(executionDescription)
      }
    } else {
      // TODO: Need to handle trying to run an unknown state (should be picked-up in validation though)
      throw (boom.badRequest(`Unknown state '${stateNameToRun}' in stateMachine '${this.name}'`))
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
          _this.runState(executionDescription)
        }
      }
    )
  }
}

module.exports = StateMachine
