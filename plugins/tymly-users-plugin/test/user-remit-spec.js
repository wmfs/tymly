/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const GET_USER_REMIT_STATE_MACHINE = 'tymlyUsersTest_getUserRemit_1_0'

describe('user-remit tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should start the state machine to get user remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: ['wmfs_propertyViewer_1_0'],
          categoryNames: ['hr'],
          teamNames: ['socialClub'],
          todoExecutionNames: ['5200987c-bb03-11e7-abc4-cec278b6b50a'],
          formNames: ['wmfs_bookSomeoneSick_1_0', 'wmfs_createNewEmployee_1_0'],
          startable: ['wmfs_bookSomoneSick_1_0']
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })
})
