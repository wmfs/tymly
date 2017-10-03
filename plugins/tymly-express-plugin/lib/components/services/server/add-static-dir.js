'use strict'

const async = require('async')
const cpr = require('cpr')

const staticComponents = ['images']

module.exports = function (app, express, blueprintComponents, config, messages, tempDir, callback) {
  const path = require('path')
  let baseDir

  if (config.hasOwnProperty('staticRootDir')) {
    baseDir = config.staticRootDir
  } else {
    baseDir = path.join(tempDir, 'tymly', 'static')
  }

  messages.subHeading('Static root ' + JSON.stringify(baseDir))

  async.forEach(
    staticComponents,

    function (staticComponent, cb) {
      messages.info('Applying ' + staticComponent)

      if (blueprintComponents.hasOwnProperty(staticComponent)) {
        const components = blueprintComponents[staticComponent]

        async.forEachOf(

          components,

          function (component, componentId, cb2) {
            // From: component.filePath
            const toPath = path.join(baseDir, staticComponent, component.namespace, component.filename)
            messages.detail(component.namespace + '\\' + component.filename)
            cpr(
              component.filePath,
              toPath,
              {
                overwrite: true
              },
              function (err, files) {
                if (err) {
                  cb2(err)
                } else {
                  cb2(null)
                }
              }
            )
          },

          function (err) {
            if (err) {
              cb(err)
            } else {
              cb(null)
            }
          }

        )
      } else {
        cb(null)
      }
    },

    function (err) {
      if (err) {
        callback(err)
      } else {
        app.use(express.static(baseDir))
        callback(null)
      }
    }
  )
}
