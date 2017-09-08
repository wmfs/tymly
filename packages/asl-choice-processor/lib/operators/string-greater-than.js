'use strict'

module.exports = function stringGreaterThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue > comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
