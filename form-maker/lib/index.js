'use strict'

const async = require('async')
const path = require('path')
const glob = require('glob')
const jsonFile = require('jsonfile')

module.exports = function formMaker (options, callback) {
  let modelsDir = path.join(options.blueprintDir, 'models')

  console.log('Models directory: ', modelsDir)

  glob(path.join(modelsDir, '*.json'), function (err, files) {
    if (err) {
      console.log('Error: ', err)
      callback(err)
    } else {
      // Iterate through each JSON file
      async.each(
        files,
        function (filePath, cb) {
          console.log('Filepath: ' + filePath)

          jsonFile.readFile(filePath, function (err, obj) {
            if (err) {
              console.log('Error: ', err)
              callback(err)
            } else {
              console.dir(obj)
              cb(null)
            }
          })
        },
        function (err) {
          console.log(err)
          callback(null)
        })
    }
  })
}
