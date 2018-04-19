/* eslint-env mocha */

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect

const NORMAL_STATE_MACHINE_NAME = 'tymlyTest_runFunction'
const CALLBACK_STATE_MACHINE_NAME = 'tymlyTest_runCallbackFunction'
const UNKNOWN_STATE_MACHINE_NAME = 'tymlyTest_runUnknownFunction'

describe('Test the run function state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, statebox// , functions

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
        // functions = tymlyServices.functions
        done()
      }
    )
  })

  it('should run the run function state machine with the normal function', done => {
    statebox.startExecution(
      {
        options: {
          name: 'Jim'
        }
      },
      NORMAL_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, execDescription) => {
        expect(err).to.eql(null)
        expect(execDescription.status).to.eql('SUCCEEDED')
        expect(execDescription.ctx.result).to.eql('Hello World.')
        done()
      }
    )
  })

  it('should run the run function state machine with the callback function', done => {
    statebox.startExecution(
      {
        options: {
          age: '28'
        }
      },
      CALLBACK_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, execDescription) => {
        expect(err).to.eql(null)
        expect(execDescription.status).to.eql('SUCCEEDED')
        expect(execDescription.ctx.result).to.eql('Hello World.')
        done()
      }
    )
  })

  it('should run the run function state machine with the unknown function', done => {
    statebox.startExecution(
      {},
      UNKNOWN_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, execDescription) => {
        if (err) return done(err)
        expect(execDescription.status).to.eql('FAILED')
        expect(execDescription.errorCode).to.eql('UNKNOWN_FUNCTION')
        expect(execDescription.errorMessage).to.eql('Cannot find function: tymlyTest_unknownFunction')
        done()
      }
    )
  })

  it('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
