/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

  let tymlyService
  let statebox
  let client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should create and populate the wmfs.building database table', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      }, // input
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
      'select uprn, building_area, building_floors, height_of_building, sprinkler_coverage from wmfs.building order by uprn',
      function (err, result) {
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                'building_floors': 2,
                'building_area': '700.00',
                'height_of_building': '5.00',
                'sprinkler_coverage': 100,
                'uprn': '1234567890'
              },
              {
                'building_floors': 3,
                'building_area': '1500.00',
                'height_of_building': '7.00',
                'sprinkler_coverage': 75,
                'uprn': '1234567891'
              },
              {
                'building_floors': 1,
                'building_area': '120.00',
                'height_of_building': '6.00',
                'sprinkler_coverage': 40,
                'uprn': '1234567892'
              },
              {
                'building_floors': 8,
                'building_area': '1000.00',
                'height_of_building': '24.00',
                'sprinkler_coverage': 100,
                'uprn': '1234567893'
              },
              {
                'building_floors': 20,
                'building_area': '1750.00',
                'height_of_building': '60.00',
                'sprinkler_coverage': 50,
                'uprn': '1234567894'
              },
              {
                'building_floors': 14,
                'building_area': '12500.00',
                'height_of_building': '48.00',
                'sprinkler_coverage': 60,
                'uprn': '1234567895'
              },
              {
                'building_floors': 1,
                'building_area': '350.00',
                'height_of_building': '10.00',
                'sprinkler_coverage': 100,
                'uprn': '1234567896'
              }
            ]
          )
          done()
        }
      }
    )
  })

  it('Should be clean up the database', function (done) {
    client.query(
      `DELETE FROM wmfs.building WHERE uprn::text LIKE '123456789%';`,
      function (err, result) {
        if (err) {
          done(err)
        } else {
          expect(result.rowCount).to.eql(7)
          done()
        }
      }
    )
  })

  it('Should find a now empty database', function (done) {
    client.query(
      'select * from wmfs.building;',
      function (err, result) {
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql([])
          done()
        }
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
