'use strict'
const debug = require('debug')('statebox')
const moduleClasses = {}

module.exports.findModuleByName = function findModuleByName (name) {
  return moduleClasses[name]
}

// Adds a class for creating
module.exports.createModule = function createModule (moduleName, moduleClass) {
  moduleClasses[moduleName] = moduleClass
  debug(`Add module class '${moduleName}'`)
}

module.exports.createModules = function createModules (resourceModules) {
  for (const [moduleName, moduleClass] of Object.entries(resourceModules))
    this.createModule(moduleName, moduleClass)
}
