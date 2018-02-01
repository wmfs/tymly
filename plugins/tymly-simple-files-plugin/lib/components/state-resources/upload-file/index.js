'use strict'

var fs = require('file-system')

class UploadFile {
  init (resourceConfig, env, callback) {
    console.log(`----->`, env.bootedServices.storage.models)
    this.files = env.bootedServices.storage.models['tymly_files']
    callback(null)
  }

  run (event, context) {
    console.log('In Upload File')
    console.log(event)
    console.log(event.base64)

    fs.writeFile(`C:\\` + event.fileName, event.base64, function (err) {
      console.log(err)
    })

    this.files.upsert(
      {
        fileName: event.fileName
      },
      {}
    )
      .then((doc) => {
        context.sendTaskSuccess({
          fileId: doc.idProperties.id,
          fileName: event.fileName
        })
      })
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = UploadFile
