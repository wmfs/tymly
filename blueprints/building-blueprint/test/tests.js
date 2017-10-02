/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

  let statebox
  let client

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        client = flobotServices.storage.client
        done()
      }
    )
  })

  it('should create and populate the wmfs.building database table', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        done()
      }
    )
  })

  it('Should be the correct data in the database', function (done) {
    client.query(
      'select uprn, footprint, floors, height, one_yr_fire_alarm, one_yr_incident, sprinkler_coverage from wmfs.building order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                uprn: '20811',
                footprint: 10000,
                floors: 8,
                height: 24,
                one_yr_fire_alarm: 0,
                one_yr_incident: 0,
                sprinkler_coverage: 100
              },
              {
                uprn: '21411',
                footprint: 12500,
                floors: 14,
                height: 48,
                one_yr_fire_alarm: 0,
                one_yr_incident: 3,
                sprinkler_coverage: 60
              },
              {
                uprn: '10014008811',
                footprint: 700,
                floors: 2,
                height: 5,
                one_yr_fire_alarm: 1,
                one_yr_incident: 0,
                sprinkler_coverage: 100
              },
              {
                uprn: '10033912311',
                footprint: 1500,
                floors: 3,
                height: 7,
                one_yr_fire_alarm: 1,
                one_yr_incident: 2,
                sprinkler_coverage: 75
              },
              {
                uprn: '100071414911',
                footprint: 120,
                floors: 1,
                height: 6,
                one_yr_fire_alarm: 3,
                one_yr_incident: 2,
                sprinkler_coverage: 40
              },
              {
                uprn: '100071448211',
                footprint: 350,
                floors: 1,
                height: 10,
                one_yr_fire_alarm: 1,
                one_yr_incident: 2,
                sprinkler_coverage: 100
              },
              {
                uprn: '100071449911',
                footprint: 1750,
                floors: 20,
                height: 60,
                one_yr_fire_alarm: 1,
                one_yr_incident: 2,
                sprinkler_coverage: 50
              }
            ]
          )
          done()
        }
      }
    )
  })
})
