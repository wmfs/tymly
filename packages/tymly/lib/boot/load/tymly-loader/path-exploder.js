const _ = require('lodash')
const glob = require('glob')
const path = require('upath')

module.exports = function pathExploder (sourcePaths, options) {
  if (_.isString(sourcePaths)) {
    sourcePaths = [sourcePaths]
  }

  let expectModule
  if (options.hasOwnProperty('expectModule')) {
    if (_.isBoolean(options.expectModule)) {
      expectModule = options.expectModule
    } else {
      expectModule = false
    }
  } else {
    expectModule = false
  }

  // And explode...
  // * Split on ; and glob off
  // -------------------------
  const explodedDirs = []
  sourcePaths.forEach(function (sourcePath) {
    if (_.isString(sourcePath)) {
      const parts = sourcePath.split(';')
      parts.forEach(function (rawPart) {
        if (rawPart.trim().length > 0) {
          const part = path.normalize(rawPart)
          const globbed = glob.sync(
            part,
            {}
          )

          if (globbed.length > 0) {
            globbed.forEach(
              function (dir) {
                if (expectModule) {
                  dir = require.resolve(dir)
                  if (path.basename(dir) === 'index.js') {
                    dir = path.dirname(dir)
                  }
                }

                if (options.hasOwnProperty('suffix') && _.isString(options.suffix)) {
                  // So... if the last part of the path looks like a node.js module
                  // chances are we want to get rid of that before adding the suffix
                  // - This allows easy require.resolve() pointing to plugins
                  if (path.basename(dir) === 'index.js') {
                    dir = path.dirname(dir)
                  }

                  dir = path.join(dir, options.suffix)
                }

                explodedDirs.push(dir)
              }
            )
          } else {
            options.messages.warning(`The directory at path ${rawPart} yielded no content `)
          }
        }
      })
    }
  })

  return explodedDirs
}
