'use strict'

module.exports = function stringLessThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue < comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
