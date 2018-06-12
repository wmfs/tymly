/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')

xdescribe('statebox service RBAC authorisation tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox
  let rbac

  describe('setup', () => {
    it('boot Tymly', function (done) {
      tymly.boot(
        {
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/access-controlled-blueprint')
          ],
          pluginPaths: [
            path.resolve(__dirname, './fixtures/plugins/success-plugin'),
            path.resolve(__dirname, './fixtures/plugins/heartbeat-plugin')
          ]
        },
        function (err, tymlyServices) {
          if (err) return done(err)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          rbac = tymlyServices.rbac

          rbac.debug()

          done()
        }
      )
    })

    it('grant \'admin\' permission to \'administrator\'', async () => {
      await rbac.ensureUserRoles('administrator', ['admin'])
      await rbac.refreshRbacIndex()

      rbac.debug()
    })
  })

  describe('start execution tests', () => {
    const tests = [
      {
        label: 'everyone',
        blueprint: 'tymlyTest_everyone_1_0',
        allowed: [null, 'jim.smith', 'administrator'],
        disallowed: []
      },
      {
        label: 'authenticated',
        blueprint: 'tymlyTest_authenticated_1_0',
        allowed: ['jim.smith', 'administrator'],
        disallowed: [null]
      } /* ,
    {
      label: 'admin',
      blueprint: 'tymlyTest_admin_1_0',
      allowed: ['administrator'],
      disallowed: [null, 'jim.smith']
    } */
    ]

    for (const test of tests) {
      for (const allowed of test.allowed) {
        it(`${allowed} able to start '${test.label}'`, async () => {
          const execDesc = await statebox.startExecution(
            { },
            test.blueprint,
            {
              sendResponse: 'COMPLETE',
              userId: allowed
            }
          )
          expect(execDesc.status).to.eql('SUCCEEDED')
          expect(execDesc.ctx.success).to.eql('Yes boys!')
        })
      } // allowed

      for (const disallowed of test.disallowed) {
        it(`${disallowed} not allowed to start '${test.label}'`, async () => {
          const execDesc = await statebox.startExecution(
            { },
            test.blueprint,
            {
              sendResponse: 'COMPLETE',
              userId: disallowed
            }
          )
          expect(execDesc.status).to.eql('FAILED')
          expect(execDesc.stateMachineName).to.eql(test.blueprint)
          expect(execDesc.errorCode).to.eql('401')
        })
      } // allowed
    } // for ...
  }) // start execution tests

  describe('stop execution tests', () => {
    const tests = [
      {
        label: 'everyone',
        blueprint: 'tymlyTest_everyoneHeartBeat_1_0',
        allowed: [null, 'jim.smith', 'administrator'],
        disallowed: []
      },
      {
        label: 'authenticated',
        blueprint: 'tymlyTest_authenticatedHeartBeat_1_0',
        allowed: ['jim.smith', 'administrator'],
        disallowed: [null]
      },
      {
        label: 'owner',
        blueprint: 'tymlyTest_ownerHeartBeat_1_0',
        allowed: ['the-stopper'],
        disallowed: [null, 'jim.smith', 'administrator']
      }
    ]

    for (const test of tests) {
      for (const allowed of test.allowed) {
        describe(`${allowed} is able to stop ${test.label} heartbeat`, () => {
          let executionName

          it(`start ${test.label} heartbeat`, async () => {
            const execDesc = await statebox.startExecution(
              {},
              test.blueprint,
              {
                sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:heartBeat',
                userId: 'the-stopper'
              }
            )
            expect(execDesc.status).to.eql('RUNNING')
            executionName = execDesc.executionName
          })

          it(`${allowed} is able to stop '${test.label}'`, async () => {
            const execDesc = await statebox.stopExecution(
              'Form cancelled by user',
              'CANCELLED',
              executionName,
              {
                userId: allowed
              }
            )

            expect(execDesc.status).to.eql('STOPPED')
          })
        })
      } // for allowed ...

      for (const disallowed of test.disallowed) {
        describe(`${disallowed} is not able to stop ${test.label} heartbeat`, () => {
          let executionName

          it(`start ${test.label} heartbeat`, async () => {
            const execDesc = await statebox.startExecution(
              {},
              test.blueprint,
              {
                sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:heartBeat',
                userId: 'the-stopper'
              }
            )
            expect(execDesc.status).to.eql('RUNNING')
            executionName = execDesc.executionName
          })

          it(`${disallowed} is not able to stop '${test.label}'`, async () => {
            const execDesc = await statebox.stopExecution(
              'Form cancelled by user',
              'CANCELLED',
              executionName,
              {
                userId: disallowed
              }
            )

            expect(execDesc.status).to.eql('FAILED')
          })
        })
      } // for allowed ...
    } // for stop tests ...
  }) // stop execution

  describe('cleanup', () => {
    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
