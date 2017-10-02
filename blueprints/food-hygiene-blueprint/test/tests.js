/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'fsa_refreshFromXmlFile_1_0'

  let statebox
  let client

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-etl-plugin'),
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

  it('should create and populate the fsa.food_ratings database table', function (done) {
    statebox.startExecution(
      {
        xmlPath: path.resolve(__dirname, './fixtures/food_ratings.xml'),
        csvPath: path.resolve(__dirname, './output/inserts/food_ratings.csv'),
        sourceDir: path.resolve(__dirname, './output')
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
      'select fhrsid, local_authority_business_id, business_name, business_type, business_type_id, address_line_1, ' +
      'address_line_2, address_line_3, address_line_4, postcode, rating_value, rating_key, TO_CHAR(rating_date, \'DD/MM/YYYY\') AS rating_date, ' +
      'local_authority_code, local_authority_name, local_authority_website, local_authority_email_address, ' +
      'hygiene, structural, confidence_in_management, scheme_type, new_rating_pending, longitude, latitude ' +
      'from fsa.food_ratings order by fhrsid;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                fhrsid: '601580',
                local_authority_business_id: 'PI/000462752',
                business_name: '2 M\'S',
                business_type: 'Retailers - other',
                business_type_id: 4613,
                address_line_1: '10A Northfield Road',
                address_line_2: 'Harborne',
                address_line_3: 'Birmingham',
                address_line_4: null,
                postcode: 'B17 0SS',
                rating_value: '5',
                rating_key: 'fhrs_5_en-GB',
                rating_date: '01/03/2017',
                local_authority_code: '402',
                local_authority_name: 'Birmingham',
                local_authority_website: 'http://www.birmingham.gov.uk/environmental-health',
                local_authority_email_address: 'nick.lowe@birmingham.gov.uk',
                hygiene: 5,
                structural: 5,
                confidence_in_management: 5,
                scheme_type: 'FHRS',
                new_rating_pending: 'False',
                longitude: '-1.96557800',
                latitude: '52.45580100'
              },
              {
                fhrsid: '670211',
                local_authority_business_id: 'PI/000615818',
                business_name: 'Business 1',
                business_type: 'Restaurant/Cafe/Canteen',
                business_type_id: 1,
                address_line_1: '1 ABC Street',
                address_line_2: 'Birmingham',
                address_line_3: null,
                address_line_4: null,
                postcode: 'B5 5TH',
                rating_value: '5',
                rating_key: 'fhrs_5_en-GB',
                rating_date: '12/12/2014',
                local_authority_code: '402',
                local_authority_name: 'Birmingham',
                local_authority_website: 'http://www.birmingham.gov.uk/environmental-health',
                local_authority_email_address: 'email@birmingham.gov.uk',
                hygiene: 5,
                structural: 5,
                confidence_in_management: 5,
                scheme_type: 'FHRS',
                new_rating_pending: 'False',
                longitude: '-1.82057600',
                latitude: '52.41739500'
              },
              {
                fhrsid: '800341',
                local_authority_business_id: 'PI/000626847',
                business_name: 'Business 3',
                business_type: 'Retailers - other',
                business_type_id: 4613,
                address_line_1: '3 ABC Street',
                address_line_2: 'Weoley',
                address_line_3: 'Birmingham',
                address_line_4: null,
                postcode: 'B31 2NN',
                rating_value: 'Exempt',
                rating_key: 'fhrs_exempt_en-GB',
                rating_date: '11/08/2015',
                local_authority_code: '402',
                local_authority_name: 'Birmingham',
                local_authority_website: 'http://www.birmingham.gov.uk/environmental-health',
                local_authority_email_address: 'email@birmingham.gov.uk',
                hygiene: null,
                structural: null,
                confidence_in_management: null,
                scheme_type: 'FHRS',
                new_rating_pending: 'False',
                longitude: '-1.92216700',
                latitude: '52.41560700'
              },
              {
                fhrsid: '853976',
                local_authority_business_id: 'PI/000598851',
                business_name: 'Business 4',
                business_type: 'Other catering premises',
                business_type_id: 7841,
                address_line_1: 'Stall 5',
                address_line_2: '34 ABC Street',
                address_line_3: 'Birmingham',
                address_line_4: null,
                postcode: 'B5 4RQ',
                rating_value: '4',
                rating_key: 'fhrs_4_en-GB',
                rating_date: '08/03/2016',
                local_authority_code: '402',
                local_authority_name: 'Birmingham',
                local_authority_website: 'http://www.birmingham.gov.uk/environmental-health',
                local_authority_email_address: 'nick.lowe@birmingham.gov.uk',
                hygiene: 5,
                structural: 5,
                confidence_in_management: 10,
                scheme_type: 'FHRS',
                new_rating_pending: 'False',
                longitude: '-1.99509900',
                latitude: '52.47612200'
              },
              {
                fhrsid: '912722',
                local_authority_business_id: 'PI/000631313',
                business_name: 'Business 2',
                business_type: 'Other catering premises',
                business_type_id: 7841,
                address_line_1: '2 ABC Street',
                address_line_2: 'Birmingham',
                address_line_3: null,
                address_line_4: null,
                postcode: 'B1 3HE',
                rating_value: '5',
                rating_key: 'fhrs_5_en-GB',
                rating_date: '07/09/2016',
                local_authority_code: '402',
                local_authority_name: 'Birmingham',
                local_authority_website: 'http://www.birmingham.gov.uk/environmental-health',
                local_authority_email_address: 'email@birmingham.gov.uk',
                hygiene: 5,
                structural: 0,
                confidence_in_management: 5,
                scheme_type: 'FHRS',
                new_rating_pending: 'False',
                longitude: '-1.99132100',
                latitude: '52.42513400'
              }
            ]
          )
          done()
        }
      }
    )
  })
})
