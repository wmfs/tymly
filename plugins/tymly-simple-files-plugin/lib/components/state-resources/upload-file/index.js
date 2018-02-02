'use strict'

const fs = require('file-system')

class UploadFile {
  init (resourceConfig, env, callback) {
    this.files = env.bootedServices.storage.models['tymly_files']
    callback(null)
  }

  run (event, context) {
    const str = event.base64
    var actualbase64String = str.replace(/^data:+[a-z]+\/+[a-z]+;base64,/, '')

    const binaryData = new Buffer(actualbase64String, 'base64')

    this.files.upsert(
      {
        fileName: event.fileName
      },
      {}
    )
      .then((doc) => {
        fs.writeFile(`C:\\` + doc.idProperties.id + `.txt`, binaryData, 'binary', function (err) {
          console.log(err)
        })
        context.sendTaskSuccess({
          fileId: doc.idProperties.id,
          fileName: event.fileName
        })
      })
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = UploadFile
