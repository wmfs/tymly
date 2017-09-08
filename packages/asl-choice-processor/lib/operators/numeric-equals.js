'use strict'

module.exports = function numericEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue === comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
