/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('Incidents state machines', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const GET_INCIDENTS_IN_PROG_STATE_MACHINE = 'tymly_getIncidentsInProgress_1_0'
  const GET_INCIDENT_SUMMARY = 'tymly_incidentSummary_1_0'
  let statebox

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

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

  it('should set up the test resources', function () {
    return sqlScriptRunner('./scripts/setup.sql', client)
  })

  it('should start execution to get incidents in progress', function (done) {
    statebox.startExecution(
      {},
      GET_INCIDENTS_IN_PROG_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        console.log(executionDescription.ctx.requiredHumanInput)
        expect(executionDescription.currentStateName).to.eql('AwaitingHumanInput')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx.requiredHumanInput.uiType).to.eql('board')
        expect(executionDescription.ctx.requiredHumanInput.uiName).to.eql('tymly_incidentsInProgress')
        expect(Object.keys(executionDescription.ctx.requiredHumanInput.data).includes('incidents')).to.eql(true)
        done(err)
      }
    )
  })

  it('should start execution to get incident summary', function (done) {
    statebox.startExecution(
      {
        incidentYear: 2017,
        incidentNumber: 1234
      },
      GET_INCIDENT_SUMMARY,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.ctx.requiredHumanInput.uiType).to.eql('board')
          expect(executionDescription.ctx.requiredHumanInput.uiName).to.eql('tymly_incidentSummary')
          expect(executionDescription.ctx.requiredHumanInput.data.incidentYear).to.eql(2017)
          expect(executionDescription.ctx.requiredHumanInput.data.incidentNumber).to.eql('1234')
          expect(executionDescription.ctx.requiredHumanInput.boardKeys.incidentYear).to.eql(2017)
          expect(executionDescription.ctx.requiredHumanInput.boardKeys.incidentNumber).to.eql(1234)
          done()
        } catch (e) {
          done(e)
        }
      }
    )
  })

  xit('should tear down the test resources', function () {
    return sqlScriptRunner('./scripts/cleanup.sql', client)
  })
})
