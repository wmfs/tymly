/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

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
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should create and populate the wmfs.fire_safety database table', function (done) {
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

  it('Should be the correct data (wmfs.fire_safety) in the database', function (done) {
    client.query(
      'select uprn, fs_management, last_enforcement, building_regs_ignored from wmfs.fire_safety order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {uprn: '20815', fs_management: 4, last_enforcement: 4, building_regs_ignored: 'N'},
              {uprn: '21484', fs_management: 1, last_enforcement: 6, building_regs_ignored: 'Y'},
              {uprn: '10014008879', fs_management: 1, last_enforcement: 1, building_regs_ignored: 'Y'},
              {uprn: '10033912337', fs_management: 2, last_enforcement: 2, building_regs_ignored: 'N'},
              {uprn: '100071414995', fs_management: 3, last_enforcement: 3, building_regs_ignored: 'Y'},
              {uprn: '100071448271', fs_management: 0, last_enforcement: 0, building_regs_ignored: 'Y'},
              {uprn: '100071449927', fs_management: 5, last_enforcement: 5, building_regs_ignored: 'N'}
            ]
          )
          done()
        }
      }
    )
  })

  it('Should be the correct data (wmfs.building_incident_stats) in the database', function (done) {
    client.query(
      'select uprn, one_year_fire_alarm_actuations, one_year_fire_incidents from wmfs.building_incident_stats order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                uprn: '2633',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '2822',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 2
              },
              {
                uprn: '2825',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '2911',
                one_year_fire_alarm_actuations: 34,
                one_year_fire_incidents: 1
              },
              {
                uprn: '3014',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '3015',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '3171',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '3242',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '3719',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 21
              },
              {
                uprn: '3834',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4027',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4274',
                one_year_fire_alarm_actuations: 45,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4517',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4535',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 0
              },
              {
                uprn: '4617',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4672',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '4689',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 31
              },
              {
                uprn: '5086',
                one_year_fire_alarm_actuations: 76,
                one_year_fire_incidents: 1
              },
              {
                uprn: '5360',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '5502',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 0
              },
              {
                uprn: '5975',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6175',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6178',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6187',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6260',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 71
              },
              {
                uprn: '6328',
                one_year_fire_alarm_actuations: 78,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6624',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6766',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1
              },
              {
                uprn: '6773',
                one_year_fire_alarm_actuations: 0,
                one_year_fire_incidents: 1020
              }
            ]
          )
          done()
        }
      }
    )
  })
})
