'use strict'

module.exports = function booleanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue === comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
