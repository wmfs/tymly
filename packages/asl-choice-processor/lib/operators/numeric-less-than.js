'use strict'

module.exports = function numericLessThanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue < comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
