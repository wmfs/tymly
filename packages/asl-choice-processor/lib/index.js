'use strict'

const InputValueCache = require('./Input-value-cache')
const getTopLevelChoices = require('./get-top-level-choices')
const _ = require('lodash')

module.exports = function (definition) {
  const choices = getTopLevelChoices(definition.Choices)

  return function calculateNextState (values) {
    const inputCache = new InputValueCache()
    let nextState
    choices.forEach(
      function (choice) {
        if (_.isUndefined(nextState)) {
          const inputValue = inputCache.get(choice.definition.Variable, values)
          nextState = choice.operator(
            inputValue,
            choice.operatorValue,
            choice.definition.Next,
            inputCache
          )
        }
      }
    )
    if (_.isUndefined(nextState) && _.isString(definition.Default)) {
      nextState = definition.Default
    }
    return nextState
  }
}
