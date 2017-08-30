'use strict'

module.exports = function numericGreaterThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue > comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
