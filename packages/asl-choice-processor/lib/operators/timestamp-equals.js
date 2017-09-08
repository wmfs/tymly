'use strict'

module.exports = function timestampEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue === comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
