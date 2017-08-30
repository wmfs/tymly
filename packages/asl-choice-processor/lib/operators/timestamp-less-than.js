'use strict'

module.exports = function timestampLessThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue < comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
