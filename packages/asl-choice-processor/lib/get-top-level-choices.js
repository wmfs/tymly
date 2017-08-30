'use strict'

const _ = require('lodash')
const operators = require('./operators')

module.exports = function getTopLevelChoices (choicesDefinition) {
  const topLevelChoices = []

  choicesDefinition.forEach(
    function (choiceDefinition) {
      // Find first operator
      let operator
      let operatorValue
      _.forOwn(
        choiceDefinition,
        function (value, key) {
          if (_.isUndefined(operator)) {
            if (operators.hasOwnProperty(key)) {
              operator = operators[key]
              operatorValue = value
            }
          }
        }
      )

      topLevelChoices.push(
        {
          operator: operator,
          operatorValue: operatorValue,
          definition: _.cloneDeep(choiceDefinition)
        }
      )
    }
  )
  return topLevelChoices
}