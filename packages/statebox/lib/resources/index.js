'use strict'
const debug = require('debug')('statebox')
const moduleClasses = {}
const _ = require('lodash')

module.exports.findModuleByName = function findModuleByName (name) {
  return moduleClasses[name]
}

// Adds a class for creating
module.exports.createModule = function createModule (moduleName, moduleClass) {
  moduleClasses[moduleName] = moduleClass
  debug(`Add module class '${moduleName}'`)
}

module.exports.createModules = function createModules (resourceModules) {
  const _this = this
  _.forOwn(
    resourceModules,
    function (moduleClass, moduleName) {
      _this.createModule(moduleName, moduleClass)
    }
  )
}
