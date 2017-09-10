'use strict'

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

module.exports.createStateMachine = function createStateMachine (stateMachineName, definition, options) {
  function parseStateMachines (topLevel, root) {
    if (_.isArray(root)) {
      root.forEach(
        function (arrayElement) {
          parseStateMachines(topLevel, arrayElement)
        }
      )
    } else if (_.isObject(root)) {
      if (root.hasOwnProperty('StartAt')) {
        if (topLevel) {
          parsedstateMachines[stateMachineName] = root
        } else {
          parsedstateMachines[`${stateMachineName}:${root.StartAt}`] = root
        }
      }
      _.forOwn(
        root,
        function (value, key) {
          parseStateMachines(false, value)
        }
      )
    }
  }

  const parsedstateMachines = {}
  const stateMachineAnalysis = this.validateStateMachineDefinition(stateMachineName, definition)

  if (stateMachineAnalysis.summary.errorCount === 0) {
    parseStateMachines(true, definition)
    _.forOwn(
      parsedstateMachines,
      function (branchDefinition, branchPath) {
        stateMachines[branchPath] = new StateMachine(branchPath, branchDefinition, options)
      }
    )
  }

  return stateMachineAnalysis
}

module.exports.deleteStateMachine = function deleteStateMachine (name) {
}

module.exports.describeStateMachine = function describeStateMachine (name) {
}

module.exports.listStateMachines = function listStateMachines () {
}

module.exports.findStateMachineByName = function findStateMachineByName (name) {
  return stateMachines[name]
}

module.exports.findStateMachines = function findStateMachines (options) {
}
