
const loadDir = require('./load-dir')
const pathExploder = require('./path-exploder')
const processRefProperties = require('./process-ref-properties')

// Options:
//   sourceLabel

module.exports = function tymlyLoader (options) {
  const messages = options.messages
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

  if (options['refProperties']) {
    processRefProperties(components, options.refProperties, options.messages)
  }

  return components
}
