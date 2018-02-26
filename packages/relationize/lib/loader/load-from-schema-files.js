
const async = require('async')
const glob = require('glob')
const path = require('path')
const jsonfile = require('jsonfile')

module.exports = function (schemas, options, callback) {
  async.eachSeries(
    options.source.paths,
    function (sourceDir, cb) {
      const fullPath = path.join(sourceDir.path, '**/*.json')
      glob(
        fullPath,
        {
          nodir: true
        },
        function (err, files) {
          if (err) {
            cb(err)
          } else {
            async.eachSeries(
              files,
              function (filePath, cb2) {
                jsonfile.readFile(filePath, function (err, content) {
                  if (err) {
                    cb2(err)
                  } else {
                    schemas.push(
                      {
                        filename: path.basename(filePath, path.extname(filePath)),
                        filePath: filePath,
                        namespace: sourceDir.namespace,
                        content: content
                      }
                    )
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
          }
        }
      )
    },

    function (err) {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    }
  )
}
