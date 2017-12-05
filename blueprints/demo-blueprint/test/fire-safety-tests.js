/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('Demo state machine tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const FILL_FIRE_SAFETY_SHORT_AUDIT_STATE_MACHINE = 'tymly_fillFireSafetyShortAudit_1_0'
  let statebox, client, fillFireSafetyShortAuditExecutionName, fireSafetyShortAudit

  const formData = {
    ignitionSources: 'Good',
    ignitionSourcesComment: 'Ignition Sources are managed very well.',
    adequateMeasures: 'Tolerable',
    adequateMeasuresComment: 'Limited measures to control the speed of the fire.',
    personsEvacuate: 'Poor',
    personsEvacuateComment: 'People can not evacuate safely at times of emergency.',
    escapeRoutes: 'Poor',
    escapeRoutesComment: 'Escape routes very poorly managed',
    adequateEquipment: 'Tolerable',
    adequateEquipmentComment: 'Reasonable equipment available.',
    adequateArrangements: 'Tolerable',
    adequateArrangementsComment: 'Fire detection systems work well.',
    adequateInstructions: 'Poor',
    adequateInstructionsComment: 'No information or guidance.',
    adequateManagement: 'Tolerable',
    adequateManagementComment: 'More safety checks suggested.',
    sufficientPrecautions: 'Yes'
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
        fireSafetyShortAudit = tymlyServices.storage.models['tymly_fireSafetyShortAudit']
        done(err)
      }
    )
  })

  it('should start execution to fill in a fire safety short audit form, stops at AwaitingHumanInput', function (done) {
    statebox.startExecution(
      {},
      FILL_FIRE_SAFETY_SHORT_AUDIT_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('AwaitingHumanInput')
        expect(executionDescription.status).to.eql('RUNNING')
        fillFireSafetyShortAuditExecutionName = executionDescription.executionName
        done(err)
      }
    )
  })

  it('should allow user to enter form data', function (done) {
    statebox.sendTaskSuccess(
      fillFireSafetyShortAuditExecutionName,
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
      fillFireSafetyShortAuditExecutionName,
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.formData).to.eql(formData)
        expect(executionDescription.currentStateName).to.eql('DeltaReindex')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })
})
