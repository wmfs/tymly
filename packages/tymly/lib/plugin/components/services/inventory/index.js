'use strict'

const _ = require('lodash')
const path = require('path')
const loadDir = require('./../../../../boot/load/tymly-loader/load-dir')
const pathExploder = require('./../../../../boot/load/tymly-loader/path-exploder')
const readPkgUp = require('read-pkg-up')

class InventoryService {
  boot (options, callback) {
    callback(null)
  }

  pruneFunctions (rootValue) {
    const _this = this
    if (_.isArray(rootValue)) {
      rootValue.forEach(
        function (element) {
          _this.pruneFunctions(element)
        }
      )
    } else if (_.isObject(rootValue)) {
      let value
      for (let key in rootValue) {
        if (rootValue.hasOwnProperty(key)) {
          value = rootValue[key]
          if (_.isFunction(value)) {
            delete rootValue[key]
          } else if (_.isObject(value)) {
            _this.pruneFunctions(value)
          }
        }
      }
    }
  }

  /**
   * Scan the supplied plugin-paths and extract all manner of information for subsequent use by tooling and doc-generators.
   * @param {Object} options
   * @param {Array<string>} options.pluginPaths Where to find all plugins that need scanning. Supports wildcards.
   * @param {Array<string>} options.blueprintPaths Where to find all blueprints that need scanning. Supports wildcards - not implemented yet.
   * @param {Function} callback Called with all the information found about the supplied plugin paths
   * @returns {undefined}
   * @example
   * inventory.collateEverything(
   *   {
   *     pluginPaths [
   *       '/some/dir/*-plugins',
   *       '/another/dir/*-plugins'
   *     ]
   *   },
   *   function (err, inventory) {
   *     // 'inventory' is an object representing the contents of all the provided plugins
   *   }
   * )
   */
  collateEverything (options, callback) {
    let inventory = {
      generated: new Date(),
      plugins: {}
    }

    // Use the main loadDir module to gather plugin-things
    // ---------------------------------------------------
    const pluginPaths = pathExploder(options.pluginPaths, {suffix: 'components', expectModule: true})

    pluginPaths.forEach(
      function (pluginPath) {
        const meta = require(path.resolve(pluginPath, './..'))

        const pluginInfo = {
          pluginPath: pluginPath,
          meta: meta,
          components: {}
        }

        loadDir(
          pluginPath,
          pluginInfo.components,
          {
            includeDocumentation: true,
            quiet: false,
            messages: options.messages
          }
        )
        inventory.plugins[pluginPath] = pluginInfo
      }
    )

    // Get rid of functions
    // --------------------
    inventory = JSON.parse(JSON.stringify(inventory))
    this.pruneFunctions(inventory)

    // Duplicate things by component type
    // ----------------------------------

    let plugin
    let componentType
    let component

    // Loop over all plugins
    for (let pluginId in inventory.plugins) {
      if (inventory.plugins.hasOwnProperty(pluginId)) {
        plugin = inventory.plugins[pluginId]
        plugin.package = readPkgUp.sync({cwd: plugin.pluginPath})
        if (plugin.hasOwnProperty('components')) {
          // Loop over all component types
          for (let componentTypeName in plugin.components) {
            if (plugin.components.hasOwnProperty(componentTypeName)) {
              componentType = plugin.components[componentTypeName]

              // Add component type if its not there already
              if (!inventory.hasOwnProperty(componentTypeName)) {
                inventory[componentTypeName] = {}
              }

              // Loop over all components
              for (let componentId in componentType) {
                if (componentType.hasOwnProperty(componentId)) {
                  component = componentType[componentId]

                  if (!inventory[componentTypeName].hasOwnProperty(componentId)) {
                    inventory[componentTypeName][componentId] = []
                  }
                  component.pluginId = pluginId
                  inventory[componentTypeName][componentId].push(component)
                }
              }
            }
          }
        }
      }
    }
    callback(null, inventory)
  }
}

module.exports = {
  serviceClass: InventoryService,
  bootBefore: ['storage']

}
