'use strict'

const messages = require('./../../startup-messages')
const path = require('path')
const _ = require('lodash')
const discoverBlueprintDirs = require('./discover-blueprint-dirs')
const extractRefProperties = require('./extract-ref-properties')

const tymlyLoader = require('./tymly-loader')

module.exports = function load (options) {
  messages.heading('Loading')

  let pluginPaths = [
    path.resolve(__dirname, './../../plugin')
  ]
  if (_.isString(options.pluginPaths)) {
    pluginPaths.push(options.pluginPaths)
  } else if (_.isArray(options.pluginPaths)) {
    pluginPaths = pluginPaths.concat(options.pluginPaths)
  }

  const pluginComponents = tymlyLoader(
    {
      sourcePaths: pluginPaths,
      processRefProperties: false,
      messages: messages,
      suffix: 'components',
      sourceLabel: 'plugins',
      expectModule: true
    }
  )

  let blueprintPaths = discoverBlueprintDirs(pluginPaths)

  if (_.isString(options.blueprintPaths)) {
    blueprintPaths.push(options.blueprintPaths)
  } else if (_.isArray(options.blueprintPaths)) {
    blueprintPaths = blueprintPaths.concat(options.blueprintPaths)
  }

  const blueprintComponents = tymlyLoader(
    {
      sourcePaths: blueprintPaths,
      messages: messages,
      expectModule: false,
      sourceLabel: 'blueprints',
      expectedMetaFilename: 'blueprint.json',
      mandatoryMetaKeys: ['namespace'],
      refProperties: extractRefProperties(pluginComponents),
      pluginComponents: pluginComponents
    }
  )

  return {
    pluginComponents: pluginComponents,
    blueprintComponents: blueprintComponents,
    pluginPaths: pluginPaths,
    blueprintPaths: blueprintPaths
  }
}
