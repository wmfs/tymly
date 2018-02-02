'use strict'

const fs = require('file-system')
const Buffer = require('safe-buffer').Buffer
const fileExtension = require('file-extension')
const upath = require('upath')

class UploadFile {
  init (resourceConfig, env, callback) {
    this.files = env.bootedServices.storage.models['tymly_files']
    callback(null)
  }

  run (event, context) {
    const str = event.base64
    let encodedBase64String
    let binaryData

    if (str) {
      encodedBase64String = str.replace(/^data:+[a-z]+\/+[a-z]+;base64,/, '')
      binaryData = new Buffer(encodedBase64String, 'base64')
    }

    this.files.upsert(
      {
        fileName: event.fileName
      },
      {}
    )
      .then((doc) => {
        fs.writeFile(`${upath.normalize('/tymly-uploads/')}${doc.idProperties.id}.${fileExtension(event.fileName)}`, binaryData, 'binary', function (err) {
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
