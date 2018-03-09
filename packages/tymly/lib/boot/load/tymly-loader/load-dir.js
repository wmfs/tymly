'use strict'

const fs = require('fs')
const path = require('path')
const messages = require('./../../../startup-messages')
const _ = require('lodash')
const parseMetaJson = require('./parse-meta-json')
const loadComponentDir = require('./load-component-dir')
const fileLoaders = require('./file-loaders/index')
const COMPONENT_DIR_BLACKLIST = ['test', 'nodeModules']

module.exports = function loadDir (rootDir, allComponents, options) {
  const quiet = options.quiet || false
  const includeDocumentation = options.includeDocumentation || false

  if (!quiet) {
    messages.info(rootDir)
  }

  let continueLoading = true

  let parsedMetaJson
  if (options.hasOwnProperty('expectedMetaFilename')) {
    parsedMetaJson = parseMetaJson(rootDir, options.expectedMetaFilename, options.mandatoryMetaKeys)
    if (!parsedMetaJson) {
      continueLoading = false
    }
  }

  if (continueLoading) {
    const componentDirs = fs.readdirSync(rootDir).filter(function (file) {
      return fs.statSync(path.join(rootDir, file)).isDirectory()
    })

    const rootComponents = {}
    let componentDir

    componentDirs.forEach(
      function (componentTypeDir) {
        const componentTypeName = _.camelCase(componentTypeDir)
        if (!rootComponents.hasOwnProperty(componentTypeName)) {
          rootComponents[componentTypeName] = {}
        }
        if (componentTypeDir[0] !== '.' && COMPONENT_DIR_BLACKLIST.indexOf(componentTypeName) === -1) {
          componentDir = path.join(rootDir, componentTypeDir)
          const dirContent = fs.readdirSync(componentDir)
          dirContent.forEach(
            function (filename) {
              let ext
              const key = _.camelCase(path.parse(filename).name)
              const stats = fs.statSync(path.join(componentDir, filename))
              let loaded

              if (stats.isFile()) {
                ext = path.extname(filename).slice(1)

                if (!fileLoaders.hasOwnProperty(ext)) {
                  ext = 'DEFAULT'
                }
                loaded = fileLoaders[ext](parsedMetaJson, key, path.join(componentDir, filename))
              } else {
                loaded = loadComponentDir(parsedMetaJson, key, path.join(componentDir, filename))

                if (includeDocumentation) {
                  loaded.content.doc = require(path.join(loaded.content.rootDirPath, 'doc'))
                }
              }

              if (loaded) {
                rootComponents[componentTypeName][loaded.key] = loaded.content
              }
            }
          )
        }
      }
    )

    // Extracted a list of component types / keys
    // Now merge with the rest of the components
    // ------------------------------------------

    let components
    for (let componentTypeName in rootComponents) {
      if (rootComponents.hasOwnProperty(componentTypeName)) {
        if (!allComponents.hasOwnProperty(componentTypeName)) {
          allComponents[componentTypeName] = {}
        }
        components = allComponents[componentTypeName]
        components = _.defaults(rootComponents[componentTypeName], components)
        allComponents[componentTypeName] = components
      }
    }
  }
}
