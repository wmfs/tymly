'use strict'

class UploadFile {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('In Upload File')
    console.log(event)
    console.log(context)
    context.sendTaskSuccess(event.fileName)
  }
}

module.exports = UploadFile
