'use strict'

const async = require('async')
const path = require('path')
const glob = require('glob')
const jsonFile = require('jsonfile')
const generateFormSchema = require('./generate-form-schema')
const generateEditorFlow = require('./generate-editor-flow')

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
          jsonFile.readFile(filePath, function (err, obj) {
            if (err) {
              console.log('Error: ', err)
              callback(err)
            } else {
              generateFormSchema(options.blueprintDir, obj)
              generateEditorFlow(filePath, options.blueprintDir)
              cb(null)
            }
          })
        },
        function (err) {
          if (err) {
            console.log(err)
            callback(null)
          } else {
            callback(null)
          }
        })
    }
  })
}
