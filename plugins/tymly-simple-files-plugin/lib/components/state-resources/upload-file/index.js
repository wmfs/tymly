'use strict'

const fs = require('file-system')
// const base64 = require('base-64')

class UploadFile {
  init (resourceConfig, env, callback) {
    this.files = env.bootedServices.storage.models['tymly_files']
    callback(null)
  }

  run (event, context) {
    const str = event.base64
    var actualbase64String = str.replace(/^data:+[a-z]+\/+[a-z]+;base64,/, '')

    const dataType = str.match(new RegExp('data:' + '(.*)' + ';base64'))

    // const decodedData = base64.decode(actualbase64String)
    const binaryData = new Buffer(actualbase64String, 'base64')

    this.files.upsert(
      {
        fileName: event.fileName
      },
      {}
    )
      .then((doc) => {
        if (dataType[1] === 'text/plain') {
          fs.writeFile(`C:\\` + doc.idProperties.id + `.txt`, binaryData, 'binary', function (err) {
            console.log(err)
          })
        } else if (dataType[1] === 'application/pdf') {
          fs.writeFile(`C:\\` + doc.idProperties.id + `.pdf`, binaryData, 'binary', function (err) {
            console.log(err)
          })
        } else if (dataType[1] === 'application/msword') {
          fs.writeFile(`C:\\` + doc.idProperties.id + `.doc`, binaryData, 'binary', function (err) {
            console.log(err)
          })
        }

        context.sendTaskSuccess({
          fileId: doc.idProperties.id,
          fileName: event.fileName
        })
      })
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = UploadFile
