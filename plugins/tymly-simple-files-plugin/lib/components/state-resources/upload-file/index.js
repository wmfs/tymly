'use strict'

const fs = require('file-system')
const base64 = require('base-64')

class UploadFile {
  init (resourceConfig, env, callback) {
    console.log(`----->`, env)
    console.log(`----->`, resourceConfig)
    this.files = env.bootedServices.storage.models['tymly_files']
    callback(null)
  }

  run (event, context) {
    console.log('In Upload File')
    console.log(event)
    console.log(event.base64)

    var actualbase64String = event.base64.replace(/^data:+[a-z]+\/+[a-z]+;base64,/, '')
    console.log(actualbase64String)

    const decodedData = base64.decode(actualbase64String)

    this.files.upsert(
      {
        fileName: event.fileName
      },
      {}
    )
      .then((doc) => {
        fs.writeFile(`C:\\` + doc.idProperties.id, decodedData, function (err) {
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
