'use strict'

const sprintf = require('sprintf-js').sprintf
const _ = require('lodash')
const Validator = require('jsonschema').Validator
const async = require('async')

// TODO: Validate that initialStateId actually points to a valid state ID

class Fsm {
  constructor (initialStateId, graph, options) {
    const expressionService = options.services.expression
    this.states = {}

    let states
    let autoNudge
    let state
    let schema
    let stateConfig
    let stateClassName
    let StateClass
    let eventId
    let candidateEvent
    let validatorResult
    let validator
    let validationErrorMessage

    function commandError (schemaError) {
      let commandError = false
      const stackParts = schemaError.stack.split(' ')
      if (stackParts.length === 7 && stackParts[5] === 'type(s)') {
        const propertyParts = stackParts[0].split('.')
        if (propertyParts.length === 2 && propertyParts[0] === 'instance') {
          const keys = _.keys(schemaError.instance)

          if (_.isObject(schemaError.instance) && keys.length === 1 && keys[0][0] === '$') {
            commandError = true // Looks like it involves a command
          }
        }
      }

      return commandError
    }

    // TODO: Check all the things!
    //  - That we have at least one state class in the options

    // Auto add a "starting" state if there isn't one already.
    if (!graph.hasOwnProperty('starting')) {
      graph.starting = {
        events: {
          started: {to: initialStateId}
        }
      }
    }

    states = options.services.states.states

    for (let stateId in graph) {
      stateConfig = JSON.parse(JSON.stringify(graph[stateId]))

      stateClassName = stateConfig.className || stateId

      // Add some state-specific things.
      stateConfig._meta = {
        stateId: stateId,
        className: stateClassName,
        flowId: options.flowId,
        flowName: options.flowName,
        flowNamespace: options.flowNamespace
      }

      if (states.hasOwnProperty(stateClassName)) {
        schema = states[stateClassName].componentModule.schema
        if (schema) {
          validator = new Validator()

          validatorResult = validator.validate(stateConfig.options, schema)

          if (validatorResult.hasOwnProperty('errors') && _.isArray(validatorResult.errors) && validatorResult.errors.length > 0) {
            validatorResult.errors.forEach(
              function (schemaError) {
                if (!commandError(schemaError)) {
                  validationErrorMessage = sprintf("Config for state '%s' in flow %s is invalid - %s",
                    stateId,
                    options.flowId,
                    schemaError.message
                  )

                  options.messages.error({
                    name: 'badStateConfig',
                    message: validationErrorMessage,
                    body: schemaError
                  })
                }
              }
            )
          }
        }

        StateClass = states[stateClassName].componentModule.stateClass

        state = new StateClass()
        state.stateConstructor(stateConfig, options || {})

        // Keep a reference to stateConfig
        // --------------------------------
        state._stateConfig = stateConfig

        // Add autoNudge to state
        // ----------------------
        autoNudge = states[stateClassName].componentModule.autoNudge
        if (autoNudge === undefined) {
          autoNudge = true
        }
        state.autoNudge = autoNudge

        // Apply events
        // ------------
        state._events = stateConfig.events || {}

        // Generate an expression (via the expression service) to handle safe evaluation
        // of conditional expressions.
        // -----------------------------------------------------------------------------
        for (eventId in state._events) {
          candidateEvent = state._events[eventId]
          if (_.isArray(candidateEvent)) {
            candidateEvent.forEach(function (targetState) {
              if (targetState.hasOwnProperty('when')) {
                targetState.expression = expressionService.parse(targetState.when)
              }
            })
          }
        }

        // And register
        // ------------
        this.states[stateId] = state
      } else {
        throw new Error(
          sprintf(
            "'%s' is an unknown class name (see state with id '%s' in flow '%s')",
            stateClassName,
            stateId,
            options.flowId
          ))
      }
    }
  }

  findStatesByClassName (className) {
    let state
    const states = {}

    for (let stateId in this.states) {
      state = this.states[stateId]
      if (state._meta.className === className) {
        states[stateId] = state
      }
    }
    return states
  }

  boot (options, callback) {
    async.eachOf(
      this.states,

      function (state, stateId, cb) {
        if (_.isFunction(state.init)) {
          state.init(state._stateConfig, options, cb)
        } else {
          cb(null)
        }
      },

      function (err) {
        callback(err)
      }
    )
  }
}

module.exports = Fsm
