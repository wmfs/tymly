'use strict'
const debug = require('debug')('statebox')
const moduleClasses = {}

module.exports.findModuleByName = function findModuleByName (name) {
  return moduleClasses[name]
}

// Adds a class for creating
module.exports.createModule = function createModule (moduleName, module) {
  moduleClasses[moduleName] = module
  debug(`Created module resource '${moduleName}'`)
}
