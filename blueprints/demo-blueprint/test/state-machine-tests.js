/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('Demo state machine tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const CLAIM_EXPENSE_STATE_MACHINE = 'tymly_claimAnExpense_1_0'
  const UPDATE_EXPENSE_CLAIM_STATE_MACHINE = 'tymly_updateAnExpenseClaim_1_0'
  let statebox

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin'),
          require.resolve('tymly-users-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        statebox = tymlyServices.statebox
        done(err)
      }
    )
  })

  it('should start state machine to claim expense', function (done) {
    statebox.startExecution(
      {},
      CLAIM_EXPENSE_STATE_MACHINE,
      {},
      (err, executionDescription) => {
        expect(err).to.eql(null)
        console.log(executionDescription)
        done(err)
      }
    )
  })

  it('should start state machine to update expense claim', function (done) {
    statebox.startExecution(
      {},
      UPDATE_EXPENSE_CLAIM_STATE_MACHINE,
      {},
      (err, executionDescription) => {
        expect(err).to.eql(null)
        console.log(executionDescription)
        done(err)
      }
    )
  })
})
