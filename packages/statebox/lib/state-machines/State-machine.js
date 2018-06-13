'use strict'
const debug = require('debug')('statebox')
const stateTypes = require('./state-types')
const boom = require('boom')

class StateMachine {
  init (stateMachineName, definition, stateMachineMeta, env, options, callback) {
    this.name = stateMachineName
    this.definition = definition
    this.meta = stateMachineMeta
    this.startAt = definition.StartAt
    this.states = {}
    this.options = options
    this.callbackManager = options.callbackManager
    debug(`Creating '${stateMachineName}' stateMachine (${definition.Comment || 'No stateMachine comment specified'})`)

    const createStates = Object.entries(definition.States)
      .map(([stateName, stateDefinition]) =>
        this._createStateDefinition(stateMachineName, stateDefinition, stateName, env)
      )
    Promise.all(createStates)
      .then(() => callback())
      .catch(err => callback(err))
  } // init

  async _createStateDefinition (stateMachineName, stateDefinition, stateName, env) {
    const State = stateTypes[stateDefinition.Type]
    if (!State) {
      throw boom.badRequest(`Unable to create state machine '${stateMachineName}' - failed to find state-type '${stateDefinition.Type}'. Does state '${stateName}' have a type property set?`)
    }

    const state = new State(stateName, this, stateDefinition, this.options)
    await state.initialise(env)
    this.states[stateName] = state
  } // _createStateDefinition

  findStateDefinitionByName (name) {
    const state = this.states[name]
    return state ? state.definition : null
  } // findStateDefinitionByName

  runState (executionDescription) {
    const stateNameToRun = executionDescription.currentStateName
    const stateToRun = this.states[stateNameToRun]
    if (!stateToRun) {
      // TODO: Need to handle trying to run an unknown state (should be picked-up in validation though)
      throw (boom.badRequest(`Unknown state '${stateNameToRun}' in stateMachine '${this.name}'`))
    }

    debug(`About to process ${stateToRun.stateType} '${stateNameToRun}' in stateMachine '${this.name}' stateMachine (executionName='${executionDescription.executionName}')`)

    this.callbackManager.fireCallback(
      'ENTERING:' + stateNameToRun,
      executionDescription.executionName,
      executionDescription
    )

    const continuation = stateToRun.resourceExpectsDoneCallback
      ? (postProcessExecutionDescription) => {
        // AFTER_RESOURCE_CALLBACK.TYPE:Form-filling
        const resourceName = postProcessExecutionDescription.currentResource.split(':')[1]
        const eventName = 'AFTER_RESOURCE_CALLBACK.TYPE:' + resourceName
        this.callbackManager.fireCallback(
          eventName,
          postProcessExecutionDescription.executionName,
          postProcessExecutionDescription
        )
      }
      : null

    stateToRun.process(
      executionDescription,
      continuation
    )
  } // runState

  async processState (executionName) {
    const executionDescription = await this.options.dao.findExecutionByName(executionName)
    // TODO: Need to handle errors as per spec!
    this.runState(executionDescription)
    return executionDescription
  } // processState
} // class StateMachine

module.exports = StateMachine
