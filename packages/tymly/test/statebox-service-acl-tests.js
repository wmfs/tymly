/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')

const startTests = [
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

const heartBeatTests = [
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

  describe('startExecution', () => {
    for (const test of startTests) {
      describe(test.label, () => {
        describe('allowed', () => {
          for (const allowed of test.allowed) {
            it(`${allowed}`, async () => {
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
        })

        describe('disallowed', () => {
          for (const disallowed of test.disallowed) {
            it(`${disallowed}`, async () => {
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
        })
      })
    } // for ...
  }) // start execution tests

  describe('stopExecution', () => {
    for (const test of heartBeatTests) {
      describe(test.label, () => {
        describe('allowed', () => {
          for (const allowed of test.allowed) {
            describe(`${allowed}`, () => {
              let executionName

              it('startExecution', async () => {
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

              it('stopExecution', async () => {
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
        })
        describe('disallowed', () => {
          for (const disallowed of test.disallowed) {
            describe(`${disallowed}`, () => {
              let executionName

              it('startExecution', async () => {
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

              it('stopExecution', async () => {
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
          } // for disallowed ...
        })
      })
    } // for stop tests ...
  }) // stop execution

  describe('sendTaskSuccess', () => {
    for (const test of heartBeatTests) {
      describe(test.label, () => {
        describe('allowed', () => {
          for (const allowed of test.allowed) {
            describe(`${allowed}`, () => {
              let executionName

              it('startExecution', async () => {
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

              it('sendTaskSuccess', async () => {
                await statebox.sendTaskSuccess(
                  executionName,
                  {},
                  {
                    userId: allowed
                  }
                )
              })
            })
          } // for allowed ...
        })
        describe('disallowed', () => {
          for (const disallowed of test.disallowed) {
            describe(`${disallowed}`, () => {
              let executionName

              it('startExecution', async () => {
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

              it('sendTaskSuccess', (done) => {
                statebox.sendTaskSuccess(
                  executionName,
                  {},
                  {
                    userId: disallowed
                  }
                )
                  .then(() => done(new Error('Should have failed!')))
                  .catch(() => done())
              })
            })
          } // for allowed ...
        })
      })
    } // for stop tests ...
  }) // stop execution

  describe('cleanup', () => {
    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
