/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

describe('registry key state resources', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox
  let registry

  describe('setup', () => {
    it('boot Tymly', function (done) {
      tymly.boot(
        {
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/registry-blueprint')
          ],
          config: {
            caches: {
              registryKeys: {}
            }
          }
        },
        function (err, tymlyServices) {
          if (err) return done(err)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          registry = tymlyServices.registry
          done()
        }
      )
    })
  })

  describe('state resources configured to a specific key', () => {
    const regKeyName = 'tymlyTest_anotherTestKey'
    const expectedRegValue = 15
    const newValue = 2
    const setTestKey = 'tymlyTest_setTestKey_1_0'
    const getTestKey = 'tymlyTest_getTestKey_1_0'

    it('check the value via the registry', () => {
      expect(registry.get(regKeyName)).to.eql(expectedRegValue)
    })

    it('check the value via the getTestKey state machine', async () => {
      const execDesc = await statebox.startExecution(
        { },
        getTestKey,
        { sendResponse: 'COMPLETE' }
      )
      expect(execDesc.ctx.result).to.eql(expectedRegValue)
    })

    it('update using the setTestKey state machine', async () => {
      await statebox.startExecution(
        { value: newValue },
        setTestKey,
        { sendResponse: 'COMPLETE' }
      )
    })

    it('verify the registry value has changed', () => {
      expect(registry.get(regKeyName)).to.eql(newValue)
    })

    it('verify the change via the getRegistryKey state machine', async () => {
      const execDesc = await statebox.startExecution(
        { },
        getTestKey,
        { sendResponse: 'COMPLETE' }
      )
      expect(execDesc.ctx.result).to.eql(newValue)
    })
  })

  describe('state resources using only event input', () => {
    const regKeyName = 'tymlyTest_testKey'
    const expectedRegValue = 15
    const setRegKeyStateMachine = 'tymlyTest_setAnyRegistryKey_1_0'
    const getRegKeyStateMachine = 'tymlyTest_getAnyRegistryKey_1_0'

    it('check the value via the registry', () => {
      expect(registry.get(regKeyName)).to.eql(expectedRegValue)
    })

    it('check the value via the getAnyRegistryKey state machine', async () => {
      const execDesc = await statebox.startExecution(
        {
          key: regKeyName
        },
        getRegKeyStateMachine,
        {
          sendResponse: 'COMPLETE'
        }
      )
      expect(execDesc.ctx.registryValue).to.eql(expectedRegValue)
    })

    it('update using the setAnyRegistryKey state machine', async () => {
      await statebox.startExecution(
        {
          key: regKeyName,
          value: 2
        },
        setRegKeyStateMachine,
        {
          sendResponse: 'COMPLETE'
        }
      )
    })

    it('verify the registry value has changed', () => {
      expect(registry.get(regKeyName)).to.eql(2)
    })

    it('verify the change via the getRegistryKey state machine', async () => {
      const execDesc = await statebox.startExecution(
        {
          key: regKeyName
        },
        getRegKeyStateMachine,
        {
          sendResponse: 'COMPLETE'
        }
      )
      expect(execDesc.ctx.registryValue).to.eql(2)
    })

    it('fetch an unknown registry key', async () => {
      const execDesc = await statebox.startExecution(
        {
          key: 'i_do_not_exist'
        },
        getRegKeyStateMachine,
        {
          sendResponse: 'COMPLETE'
        }
      )
      expect(execDesc.status).to.eql('FAILED')
    })

    it('fetch an unknown registry key, with default', async () => {
      const testDefault = 'a lovely default value'
      const execDesc = await statebox.startExecution(
        {
          key: 'i_do_not_exist',
          defaultValue: testDefault
        },
        getRegKeyStateMachine,
        {
          sendResponse: 'COMPLETE'
        }
      )
      expect(execDesc.ctx.registryValue).to.eql(testDefault)
    })
  })

  describe('shutdown', () => {
    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
