'use strict'

module.exports = function timestampGreaterThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue > comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
