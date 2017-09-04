'use strict'

const _ = require('lodash')
const Flow = require('./Flow')

const flows = {}

module.exports.validateFlowDefinition = function validateFlowDefinition (definition, callback) {
  // TODO: Make it validate! Is there a JSON Schema for Amazon State Language out there?
  // TODO: Make it adhere to everything at https://states-language.net/spec.html
  // TODO: Needs at least one state defined
  // TODO: State "Types" need to be provided, and refer to a type which is available
  // TODO: StartAt needs to be present, and refer to a state which is defined in (state-types)
  // TODO: Check that any resources referred to in Task states have been created
  callback(null)
}

module.exports.createFlow = function createFlow (flowName, definition, options, callback) {
  function parseFlows (prefix, root) {

    if (_.isArray(root)) {
      root.forEach(
        function (arrayElement) {
          parseFlows(prefix, arrayElement)
        }
      )
    } else if (_.isObject(root)) {
      if (root.hasOwnProperty('StartAt')) {
        if (prefix) {
          prefix += `:${root.StartAt}`
        } else {
          prefix = root.StartAt
        }
        parsedFlows[prefix] = root
      }
      _.forOwn(
        root,
        function (value, key) {
          parseFlows(prefix, value)
        }
      )
    }
  }

  const parsedFlows = {}
  this.validateFlowDefinition(
    definition,
    function (err) {
      if (err) {
        callback(err)
      } else {
        parseFlows(undefined, definition)

        _.forOwn(
          parsedFlows,
          function (branchDefinition, branchPath) {
            let fullFlowName = flowName
            if (branchPath.indexOf(':') !== -1) {
              fullFlowName += ':' + branchPath
            }
            flows[fullFlowName] = new Flow(fullFlowName, branchDefinition, options)
          }
        )
        callback(null)
      }
    }
  )
}

module.exports.deleteFlow = function deleteFlow (name, callback) {
}

module.exports.describeFlow = function describeFlow (name, callback) {
}

module.exports.listFlows = function listFlows (callback) {
}

module.exports.findFlowByName = function findFlowByName (name) {
  return flows[name]
}

module.exports.findFlows = function findFlows (options, callback) {
}
