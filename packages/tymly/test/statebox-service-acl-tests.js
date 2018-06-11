/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')

xdescribe('statebox service RBAC authorisation tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox

  it('boot Tymly', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/access-controlled-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/success-plugin')
        ]
      },
      function (err, tymlyServices) {
        if (err) return done(err)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox

        tymlyServices.rbac.debug()

        done()
      }
    )
  })

  it('anonymous can run \'everyone\'', async () => {
    const execDesc = await statebox.startExecution(
      { },
      'tymlyTest_everyone_1_0',
      { sendResponse: 'COMPLETE' }
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
    expect(execDesc.ctx.success).to.eql('Yes boys!')
  })

  it('anonymous can\'t run \'authenticated\'', async () => {
    const execDesc = await statebox.startExecution(
      { },
      'tymlyTest_authenticated_1_0',
      {
        sendResponse: 'COMPLETE'
      }
    )

    expect(execDesc.status).to.eql('FAILED')
    expect(execDesc.stateMachineName).to.eql('tymlyTest_authenticated_1_0')
    expect(execDesc.errorCode).to.eql('401')
    expect(execDesc.errorMessage).to.eql('\'null\' can not perform \'create\' on \'tymlyTest_authenticated_1_0\'')
  })

  it('\'jim.smith\' can run \'everyone\'', async () => {
    const execDesc = await statebox.startExecution(
      { },
      'tymlyTest_everyone_1_0',
      {
        userId: 'jim.smith',
        sendResponse: 'COMPLETE'
      }
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
    expect(execDesc.ctx.success).to.eql('Yes boys!')
  })

  it('\'jim.smith\' can run \'authenticated\'', async () => {
    const execDesc = await statebox.startExecution(
      { },
      'tymlyTest_authenticated_1_0',
      {
        userId: 'jim.smith',
        sendResponse: 'COMPLETE'
      }
    )
    expect(execDesc.status).to.eql('SUCCEEDED')
    expect(execDesc.ctx.success).to.eql('Yes boys!')
  })

  it('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
