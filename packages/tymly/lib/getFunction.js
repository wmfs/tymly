'use strict'

module.exports = function getFunction (options, funcName) {
  const services = options.services || options.bootedServices

  return services.functions.functions[funcName].func
}
