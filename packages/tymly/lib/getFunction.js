'use strict'

module.exports = function getFunction (options, funcName) {
  const services = options.services || options.bootedServices
  const func = services.functions.functions[funcName]
  if (!func) {
    throw new Error(`Function '${funcName}' not registered`)
  }
  return func.func
}
