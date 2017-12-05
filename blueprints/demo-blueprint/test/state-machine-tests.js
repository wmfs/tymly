/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('Demo state machine tests', function () {
  // this.timeout(process.env.TIMEOUT || 5000)
  this.timeout(500000)
  const CLAIM_EXPENSE_STATE_MACHINE = 'tymly_claimAnExpense_1_0'
  const UPDATE_EXPENSE_CLAIM_STATE_MACHINE = 'tymly_updateAnExpenseClaim_1_0'
  let statebox, client, expenses, id, claimExpenseExecutionName, updateClaimExecutionName

  const formData = {
    firstName: 'Homer',
    lastName: 'Simpson',
    age: 37,
    reasonForClaim: 'For beers',
    amountToClaim: 7.50,
    telephone: 1234123123,
    date: '1/1/10'
  }

  const updatedFormData = {
    reasonForClaim: 'For more beers',
    amountToClaim: 15.00
  }

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
        client = tymlyServices.storage.client
        expenses = tymlyServices.storage.models['tymly_expenses']
        done(err)
      }
    )
  })

  it('should start execution to claim expense, stops at AwaitingHumanInput', function (done) {
    statebox.startExecution(
      {},
      CLAIM_EXPENSE_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('AwaitingHumanInput')
        expect(executionDescription.status).to.eql('RUNNING')
        claimExpenseExecutionName = executionDescription.executionName
        done(err)
      }
    )
  })

  it('should allow user to enter form data', function (done) {
    statebox.sendTaskSuccess(
      claimExpenseExecutionName,
      formData,
      {},
      (err, executionDescription) => {
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('should on form \'complete\' send form data to Upserting', function (done) {
    statebox.waitUntilStoppedRunning(
      claimExpenseExecutionName,
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.formData).to.eql(formData)
        expect(executionDescription.currentStateName).to.eql('DeltaReindex')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })

  it('should check the data is in the expenses table', function (done) {
    expenses.find({}, (err, doc) => {
      console.log(doc[0])
      id = doc[0].id
      expect(doc.length).to.eql(1)
      expect(doc[0].firstName).to.eql('Homer')
      expect(doc[0].lastName).to.eql('Simpson')
      expect(doc[0].age).to.eql(37)
      expect(doc[0].reasonForClaim).to.eql('For beers')
      expect(doc[0].amountToClaim).to.eql('7.50')
      expect(doc[0].telephone).to.eql('1234123123')
      expect(doc[0].date).to.eql('1/1/10')
      done(err)
    })
  })

  it('should start execution to update expense claim to get the form data', function (done) {
    statebox.startExecution(
      {
        claimId: id
      },
      UPDATE_EXPENSE_CLAIM_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.claimId).to.eql(id)
        expect(executionDescription.ctx.formData.id).to.eql(id)
        expect(executionDescription.ctx.formData.firstName).to.eql('Homer')
        expect(executionDescription.ctx.formData.lastName).to.eql('Simpson')
        expect(executionDescription.currentStateName).to.eql('AwaitingHumanInput')
        expect(executionDescription.status).to.eql('RUNNING')
        updateClaimExecutionName = executionDescription.executionName
        done(err)
      }
    )
  })

  it('should allow user to enter some updated form data', function (done) {
    updatedFormData.id = id
    statebox.sendTaskSuccess(
      updateClaimExecutionName,
      updatedFormData,
      {},
      (err, executionDescription) => {
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('should on form \'complete\' send updated form data to Upserting', function (done) {
    statebox.waitUntilStoppedRunning(
      updateClaimExecutionName,
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.formData).to.eql(updatedFormData)
        expect(executionDescription.currentStateName).to.eql('DeltaReindex')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })

  it('should check the updated data is in the expenses table', function (done) {
    expenses.find({}, (err, doc) => {
      console.log(doc[0])
      expect(doc.length).to.eql(1)
      expect(doc[0].firstName).to.eql('Homer')
      expect(doc[0].lastName).to.eql('Simpson')
      expect(doc[0].age).to.eql(37)
      expect(doc[0].reasonForClaim).to.eql('For more beers')
      expect(doc[0].amountToClaim).to.eql('15.00')
      expect(doc[0].telephone).to.eql('1234123123')
      expect(doc[0].date).to.eql('1/1/10')
      done(err)
    })
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./scripts/cleanup.sql', client)
  })
})
