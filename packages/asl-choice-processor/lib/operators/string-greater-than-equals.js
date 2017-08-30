'use strict'

module.exports = function stringGreaterThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue >= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
