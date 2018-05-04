/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')

const REG_KEY_NAME = 'tymlyTest_mealThreshold'
const STATE_MACHINE_NAME = 'tymlyTest_setRegistryKey_1_0'

describe('setRegistryKey state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox
  let registry

  it('boot Tymly', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ],
        config: {
          caches: {
            registryKeys: {}
          }
        }
      },
      function (err, tymlyServices) {
        expect(err).to.equal(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        registry = tymlyServices.registry
        done()
      }
    )
  })

  it('check the value in the registry', () => {
    expect(registry.get(REG_KEY_NAME)).to.eql(3)
  })

  it('run setRegistryKey state machine', async () => {
    await statebox.startExecution(
      {
        key: REG_KEY_NAME,
        value: 2
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      }
    )
  })

  it('verify the registry value has changed', () => {
    expect(registry.get(REG_KEY_NAME)).to.eql(2)
  })

  it('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
