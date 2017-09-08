'use strict'

module.exports = function numericGreaterThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue >= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
