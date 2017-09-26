'use strict'

const async = require('async')
const _ = require('lodash')
const StateMachine = require('./State-machine')

const stateMachines = {}
module.exports.stateMachines = stateMachines

module.exports.validateStateMachineDefinition = function validateStateMachineDefinition (stateMachineName, definition) {
  // TODO: Make it validate! Is there a JSON Schema for Amazon State Language out there?
  // TODO: Make it adhere to everything at https://states-language.net/spec.html
  // TODO: Needs at least one state defined
  // TODO: State "Types" need to be provided, and refer to a type which is available
  // TODO: StartAt needs to be present, and refer to a state which is defined in (state-types)
  // TODO: Check that any resources referred to in Task states have been created
  return {
    summary: {
      name: stateMachineName,
      errorCount: 0,
      warningCount: 0
    },
    errors: [],
    warnings: []
  }
}

module.exports.findStates = function findStates (options) {
  const states = []
  _.forOwn(
    stateMachines,
    function (stateMachine) {
      _.forOwn(
        stateMachine.states,
        function (state) {
          const resource = state.definition.Resource
          if (resource && options.resourceToFind === resource) {
            states.push(state)
          }
        }
      )
    }
  )
  return states
}

module.exports.createStateMachines = function createStateMachine (stateMachineDefinitions, env, options, callback) {
  const _this = this

  function parseStateMachines (stateMachineName, topLevel, root) {
    if (_.isArray(root)) {
      root.forEach(
        function (arrayElement) {
          parseStateMachines(stateMachineName, topLevel, arrayElement)
        }
      )
    } else if (_.isObject(root)) {
      if (root.hasOwnProperty('StartAt')) {
        if (topLevel) {
          parsedStateMachines[stateMachineName] = root
        } else {
          parsedStateMachines[`${stateMachineName}:${root.StartAt}`] = root
        }
      }
      _.forOwn(
        root,
        function (value, key) {
          parseStateMachines(stateMachineName, false, value)
        }
      )
    }
  }

  const parsedStateMachines = {}
  _.forOwn(
    stateMachineDefinitions,
    function (definition, stateMachineName) {
      const stateMachineAnalysis = _this.validateStateMachineDefinition(stateMachineName, definition)
      if (stateMachineAnalysis.summary.errorCount === 0) {
        parseStateMachines(stateMachineName, true, definition)
      }
    }
  )

  async.eachOf(
    parsedStateMachines,
    function (stateMachine, stateMachineName, cb) {
      const sm = new StateMachine()
      sm.init(
        stateMachineName,
        stateMachine,
        env,
        options,
        function (err) {
          if (err) {
            cb(err)
          } else {
            stateMachines[stateMachineName] = sm
            cb(null)
          }
        }
      )
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

module.exports.deleteStateMachine = function deleteStateMachine (name) {
}

module.exports.describeStateMachine = function describeStateMachine (name) {
}

module.exports.listStateMachines = function listStateMachines () {
  return stateMachines
}

module.exports.findStateMachineByName = function findStateMachineByName (name) {
  return stateMachines[name]
}

module.exports.findStateMachines = function findStateMachines (options) {
}
