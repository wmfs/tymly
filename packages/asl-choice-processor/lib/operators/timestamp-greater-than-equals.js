'use strict'

module.exports = function timestampGreaterThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue >= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
