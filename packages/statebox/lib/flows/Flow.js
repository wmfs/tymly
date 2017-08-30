'use strict'
const debug = require('debug')('statebox')
const stateTypes = require('./state-types')
const _ = require('lodash')
const getExecutionDescription = require('./../utils/get-execution-description')
const boom = require('boom')

class Flow {
  constructor (flowName, definition, options) {
    const _this = this
    this.name = flowName
    this.definition = definition
    this.startAt = definition.StartAt
    this.states = {}
    debug(`Creating '${flowName}' flow (${definition.Comment || 'No flow comment specified'})`)

    _.forOwn(
      definition.States,
      function (stateDefinition, stateName) {
        const State = stateTypes[stateDefinition.Type]
        _this.states[stateName] = new State(stateName, _this, stateDefinition, options)
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
    getExecutionDescription.findByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Need to handle errors as per spec!
          throw (err)
        } else {
          const stateNameToRun = executionDescription.currentStateName
          const stateToRun = _this.states[stateNameToRun]
          if (stateToRun) {
            debug(`About to process ${stateToRun.stateType} '${stateNameToRun}' in flow '${_this.name}' flow (executionName='${executionName}')`)
            // TODO: Why, if no .process method is defined, does this intermittently not throw an error? Mocha in IDE?
            stateToRun.process(executionDescription)
          } else {
            // TODO: Need to handle trying to run an unknown state (should be picked-up in validation though)
            throw (boom.badRequest(`Unknown state '${stateNameToRun}' in flow '${_this.name}'`))
          }
        }
      }
    )
  }
}

module.exports = Flow
