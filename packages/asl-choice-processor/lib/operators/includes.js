'use strict'

module.exports = function includesOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue.includes(comparisonValue)) {
    nextState = candidateStateName
  }
  return nextState
}
