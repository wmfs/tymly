/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const UPLOAD_FILE_STATE_MACHINE = 'tymly_uploadFile_1_0'

describe('file upload tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox, tymlyService

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        tymlyService = tymlyServices.tymly
        done()
      }
    )
  })

  it('should start the state machine to get file Upload data', function (done) {
    statebox.startExecution(
      {},
      UPLOAD_FILE_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('UploadFile')
        expect(executionDescription.currentResource).to.eql('module:uploadFile')
        expect(executionDescription.stateMachineName).to.eql(UPLOAD_FILE_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should shut down Tymly nicely', async () => {
    await tymlyService.shutdown()
  })
})
