'use strict'

const async = require('async')
const path = require('path')
const glob = require('glob')

module.exports = function formMaker (options, callback) {
  let modelsDir = path.join(options.blueprintDir, 'models')

  console.log('Models directory: ', modelsDir)

  glob(path.join(modelsDir, '*.json'), function (err, files) {
    if (err) {
      console.log('Error: ', err)
      callback(err)
    } else {
      async.each(
        files,
        function (filePath, cb) {
          console.log('Filepath: ' + filePath)
          cb(null)
        },
        function (err) {
          console.log(err)
          callback(null)
        })
    }
  })
}
