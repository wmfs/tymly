'use strict'

const parser = require('esprima').parse
const evaluate = require('static-eval')

class Expression {
  constructor (expression) {
    this.ast = parser(expression).body[0].expression
  }

  evaluate (ctx) {
    return evaluate(this.ast, ctx)
  }
}

class ExpressionService {
  boot (options, callback) {
    callback(null)
  }

  /**
   * Parses a string expression and returns an object for subsequent evaluation
   *
   * @param {string} expression The expression that needs evaluating.
   * @returns {Object} Use the `evaluate` function (uses the [static-eval](https://www.npmjs.com/package/static-eval) package)
   * @example
   * var exp = expressionService.parse('a > b')
   * console.log(exp.evaluate({a: 10, b: 5})) // true
   * console.log(exp.evaluate({a: 5, b: 10})) // false
   */
  parse (expression) {
    return new Expression(expression)
  }
}

module.exports = {
  serviceClass: ExpressionService
}
