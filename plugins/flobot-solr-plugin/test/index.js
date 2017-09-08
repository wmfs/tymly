/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const assert = require('chai').assert
const flobot = require('flobot')
const path = require('path')
// const debug = require('debug')('flobot-solr-plugin')
const testModel = require('./fixtures/test-model.json')
const testModels = require('./fixtures/test-models.json')
const SolrService = require('./../lib/components/services/solr/index.js').serviceClass

describe('Simple solr tests', function () {
  let solrService
  let client
  it('should create some basic flobot services', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          'D:\\tymlyDev\\tymly\\plugins\\flobot-pg-plugin'
        ],
        blueprintPaths: [],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        client = flobotServices.storage.client
        solrService = flobotServices.solr
        expect(solrService).to.not.eql(null)
        expect(client).to.not.eql(null)
        done()
      }
    )
  })

  it('generate a SQL CREATE VIEW from a model and an attribute', () => {
    const plugin = new SolrService()
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

    const select = plugin.generateSelect(ns, testModel, attribute, solrFieldDefaults)

    expect(select).to.be.a('string')
    expect(select).to.eql('SELECT streetName AS address, PG_HASH(password, \'SALT\') AS passwordHash FROM my_schema.my_address')
  })

  it('generates multiple SQL', () => {
    const plugin = new SolrService()
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

    const sqlString = plugin.buildViewSql(ns, testModels, attributes, solrFieldDefaults)

    expect(sqlString).to.be.a('string')
    expect(sqlString).to.eql('CREATE OR REPLACE VIEW mySchema.solr_data AS SELECT streetName AS address, PG_HASH(password, \'SALT\') AS passwordHash FROM my_schema.my_address UNION SELECT streetName2 AS address, PG_HASH(password2, \'SALT\') AS passwordHash FROM my_schema.my_address_2;')
  })

  it('create database view', (done) => {
    const plugin = new SolrService()
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

    const sqlString = plugin.buildViewSql(ns, testModels, attributes, solrFieldDefaults)

    plugin.createView(sqlString, function (err) {
      console.log('~~~~~~~~~~~', err)
      done()
    })
  })

})
