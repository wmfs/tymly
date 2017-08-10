'use strict'

module.exports = function getFunction (options, funcName) {
  return options.services.functions.functions[funcName].func
}
