'use strict'

module.exports = function stringLessThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue <= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
