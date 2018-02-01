'use strict'

var fs = require('file-system')

class UploadFile {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('In Upload File')
    console.log(event)
    console.log(event.base64)

    fs.writeFile(`C:\\` + event.fileName, event.base64, function (err) {
      console.log(err)
    })

    context.sendTaskSuccess(event.fileName)
  }
}

module.exports = UploadFile
