'use strict'

const loadDir = require('./load-dir')
const messages = require('./../../../startup-messages')
const pathExploder = require('./path-exploder')

// Options:
//   sourceLabel

module.exports = function tymlyLoader (options) {
  const components = {}

  messages.subHeading('Loading ' + options.sourceLabel)
  const explodedPaths = pathExploder(
    options.sourcePaths,
    {
      suffix: options.suffix,
      expectModule: options.expectModule,
      messages: messages
    }
  )

  explodedPaths.forEach(function (rootDir) {
    loadDir(rootDir, components, options)
  })

  return components
}
