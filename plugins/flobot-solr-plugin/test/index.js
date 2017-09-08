/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')

const testModel = require('./fixtures/test-model.json')
const testModels = require('./fixtures/test-models.json')

describe('Simple solr tests', function () {

  let solrService
  let client

  it('should create some basic flobot services', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          path.resolve(__dirname, './../../flobot-pg-plugin')
        ],
        blueprintPaths: [],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)

        client = flobotServices.storage.client
        expect(client).to.not.eql(null)

        solrService = flobotServices.solr
        expect(solrService).to.not.eql(null)

        done()
      }
    )
  })

  it('should generate a SQL SELECT statement', () => {
    const attribute = {
      'modelId': 'address',
      'attributeMapping': {
        'passwordHash': 'PG_HASH(password, \'SALT\')',
        'address': '@streetName'
      }
    }
    const ns = 'mySchema'
    const solrFieldDefaults = [
      ['address', ''],
      ['passwordHash', '']
    ]

    const select = solrService.generateSelect(ns, testModel, attribute, solrFieldDefaults)
    console.log(select)

    expect(select).to.be.a('string')
    expect(select).to.eql('SELECT streetName AS address, PG_HASH(password, \'SALT\') AS passwordHash FROM my_schema.my_address')
  })

  it('should generate a SQL CREATE VIEW statement', () => {
    const attributes = [
      {
        'modelId': 'myAddress',
        'attributeMapping': {
          'passwordHash': 'PG_HASH(password, \'SALT\')',
          'address': '@streetName'
        }
      },
      {
        'modelId': 'myAddress2',
        'attributeMapping': {
          'passwordHash': 'PG_HASH(password2, \'SALT\')',
          'address': '@streetName2'
        }
      }
    ]
    const ns = 'mySchema'
    const solrFieldDefaults = [
      ['address', ''],
      ['passwordHash', '']
    ]

    const sqlString = solrService.buildViewSql(ns, testModels, attributes, solrFieldDefaults)
    console.log(sqlString)

    expect(sqlString).to.be.a('string')
    expect(sqlString).to.eql('CREATE OR REPLACE VIEW mySchema.solr_data AS \nSELECT streetName AS address, PG_HASH(password, \'SALT\') AS passwordHash FROM my_schema.my_address\nUNION\nSELECT streetName2 AS address, PG_HASH(password2, \'SALT\') AS passwordHash FROM my_schema.my_address_2;')
  })

  it('should create a database view', (done) => {
    const attributes = [
      {
        'modelId': 'myAddress2',
        'attributeMapping': {
          'passwordHash': 'PG_HASH(password2, \'SALT\')',
          'address': '@streetName2'
        }
      }
    ]
    const ns = 'mySchema'
    const solrFieldDefaults = [
      ['address', ''],
      ['passwordHash', '']
    ]

    const sqlString = solrService.buildViewSql(ns, testModels, attributes, solrFieldDefaults)

    solrService.createView(sqlString, function (err) {
      console.log('~~~~~~~~~~~', err)
      done()
    })
  })

})
