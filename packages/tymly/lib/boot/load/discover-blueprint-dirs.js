'use strict'

const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const pathExploder = require('./tymly-loader/path-exploder')

module.exports = function discoverBlueprintDirs (rawPaths, messages) {
  const pluginPaths = pathExploder(rawPaths, {expectModule: true, messages: messages})

  const pluginBlueprintDirs = []

  if (_.isArray(pluginPaths)) {
    pluginPaths.forEach(
      function (pluginPath) {
        const blueprintsDir = path.join(pluginPath, 'blueprints')
        try {
          const stats = fs.lstatSync(blueprintsDir)
          if (stats.isDirectory()) {
            const subDirs = fs.readdirSync(blueprintsDir).filter(function (file) {
              return fs.statSync(path.join(blueprintsDir, file)).isDirectory()
            })

            subDirs.forEach(
              function (subDir) {
                pluginBlueprintDirs.push(path.join(blueprintsDir, subDir))
              }
            )
          }
        } catch (err) {
          // ignore as blueprint dirs are not mandatory
        }
      }
    )
  }

  return pluginBlueprintDirs
}
