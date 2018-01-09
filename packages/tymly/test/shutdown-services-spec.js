/* eslint-env mocha */

'use strict'

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect

describe('Shutdown services tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, testService3

  it('should boot up tymly with some plugins', (done) => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/test-services-plugin')
        ]
      },
      (err, tymlyServices) => {
        tymlyService = tymlyServices.tymly
        testService3 = tymlyServices.testService3
        done(err)
      }
    )
  })

  it('should show the boot order was correct', () => {
    expect(tymlyService.orderedServiceNames).to.eql(
      [ 'inventory',
        'caches',
        'storage',
        'functions',
        'blueprintDocs',
        'registry',
        'categories',
        'temp',
        'statebox',
        'rbac',
        'users',
        'tymly',
        'testService3',
        'testService1',
        'testService2'
      ]
    )
    expect(testService3.bootOrder).to.eql(
      [
        'testService3',
        'testService1',
        'testService2'
      ]
    )
  })

  it('should shut down Tymly and plugins', async () => {
    await tymlyService.shutdown()
  })

  it('should show shutdown order was the reverse of boot', () => {
    console.log('????', testService3)
    expect(testService3.shutdownOrder).to.eql(
      [
        'testService2',
        'testService1',
        'testService3'
      ]
    )
  })
})
