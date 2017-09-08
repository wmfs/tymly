'use strict'

module.exports = function stringEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue === comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
