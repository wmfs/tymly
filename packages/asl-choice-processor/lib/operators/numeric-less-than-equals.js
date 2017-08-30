'use strict'

module.exports = function numericLessThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue <= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
