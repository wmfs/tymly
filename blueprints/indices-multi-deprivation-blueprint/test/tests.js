/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'dclg_refreshFromCsvFile_1_0'

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

  it('should create and populate the dclg.imd database table', function (done) {
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
      'select lsoa_code_2011, lsoa_name_2011, local_authority_district_code_2013, local_authority_district_name_2013 ' +
      'index_of_multiple_deprivation_score, index_of_multiple_deprivation_rank, index_of_multiple_deprivation_decile, ' +
      'income_score, income_rank, income_decile, employment_score, employment_rank, employment_decile, ' +
      'education_skills_and_training_score, education_skills_and_training_rank, education_skills_and_training_decile, ' +
      'health_deprivation_and_disability_score, health_deprivation_and_disability_rank, health_deprivation_and_disability_decile, ' +
      'crime_score, crime_rank, crime_decile, barriers_to_housing_and_services_score, barriers_to_housing_and_services_rank, ' +
      'barriers_to_housing_and_services_decile, living_environment_score, living_environment_rank, living_environment_decile, ' +
      'income_deprivation_affecting_children_index_score, income_deprivation_affecting_children_index_rank, ' +
      'income_deprivation_affecting_children_index_decile, income_deprivation_affecting_older_people_score, ' +
      'income_deprivation_affecting_older_people_rank, income_deprivation_affecting_older_people_decile, ' +
      'children_and_young_people_subdomain_score, children_and_young_people_subdomain_rank, ' +
      'children_and_young_people_subdomain_decile, adult_skills_subdomain_score, adult_skills_subdomain_rank, ' +
      'adult_skills_subdomain_decile, geographical_barriers_subdomain_score, geographical_barriers_subdomain_rank, ' +
      'geographical_barriers_subdomain_decile, wider_barriers_subdomain_score, wider_barriers_subdomain_rank, ' +
      'wider_barriers_subdomain_decile, indoors_subdomain_score, indoors_subdomain_rank, indoors_subdomain_decile, ' +
      'outdoors_subdomain_score, outdoors_subdomain_rank, outdoors_subdomain_decile, total_population_mid_2012, ' +
      'dependent_children_aged_015_mid_2012, population_aged_1659_mid_2012, older_population_aged_60_and_over_mid_2012, ' +
      'working_age_population_185964 from dclg.imd order by lsoa_code_2011;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          console.log(result)
          expect(result.rowCount).to.eql(9)
          expect(result.rows[0].lsoa_code_2011).to.eql('1234567890')
          expect(result.rows[2].lsoa_code_2011).to.eql('1234567892')
          expect(result.rows[7].lsoa_code_2011).to.eql('1234567897')
          done()
        }
      }
    )
  })

  it('Should be clean up the database', function (done) {
    client.query(
      `DELETE FROM dclg.imd WHERE lsoa_code_2011::text LIKE '123456789%';`,
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rowCount).to.eql(9)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })

  it('Should find a now empty database', function (done) {
    client.query(
      'select * from dclg.imd;',
      function (err, result) {
        expect(err).to.equal(null)
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
