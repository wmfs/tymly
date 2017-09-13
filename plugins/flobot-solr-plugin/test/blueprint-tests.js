/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const debug = require('debug')('flobot-solr-plugin')

const students = require('./fixtures/school-blueprint/models/students.json')
const studentsAttributes = require('./fixtures/school-blueprint/search-docs/students.json')

const studentsAndStaffModels = require('./fixtures/school-blueprint/test-resources/students-and-staff-models.json')
const studentsAndStaffSearchDocs = require('./fixtures/school-blueprint/test-resources/students-and-staff-search-docs.json')

describe.only('solr-blueprint tests', function () {
  this.timeout(8000);
  const ns = 'solr_plugin_test'
  const solrFieldDefaults = [
    ['id', ''],
    ['actorName', ''],
    ['characterName', '']
  ]

  let solrService
  let client

  it('should create some basic flobot services', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          path.resolve(__dirname, './../../flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/school-blueprint')
        ],
        config: {
          solrIndexFields: [
            'id',
            'actorName',
            'characterName'
          ]
        }
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
    const select = solrService.buildSelectStatement(ns, students, studentsAttributes, solrFieldDefaults)
    debug(select)
    expect(select).to.be.a('string')
    expect(select).to.eql('SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_name AS character_name FROM solr_plugin_test.students')
  })

  it('should generate a VIEW statement', () => {
    const select = solrService.buildCreateViewStatement(ns, studentsAndStaffModels, studentsAndStaffSearchDocs, solrFieldDefaults)
    debug(select)
    expect(select).to.be.a('string')
    expect(select).to.eql('CREATE OR REPLACE VIEW solr_plugin_test.solr_data AS \n' +
      'SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, character_name AS character_name FROM solr_plugin_test.students\n' +
      'UNION\n' +
      'SELECT \'staff#\' || staff_no AS id, first_name || \' \' || last_name AS actor_name, character_first_name || \' \' || character_last_name AS character_name FROM solr_plugin_test.staff;')
  })
})
