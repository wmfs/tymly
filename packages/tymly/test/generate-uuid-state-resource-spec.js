/* eslint-env mocha */

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect

const STATE_MACHINE_NAME = 'tymlyTest_generateUuid'

describe('Generate uuid state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, statebox

  it('boot tymly', done => {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should run the state machine', done => {
    statebox.startExecution(
      {},
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, execDescription) => {
        expect(err).to.eql(null)
        expect(execDescription.ctx.shortId.id.length).to.eql(8)
        expect(execDescription.ctx.shorterId.id.length).to.eql(5)
        expect(execDescription.ctx.longerId.id.length).to.eql(36)
        done()
      }
    )
  })

  it('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
