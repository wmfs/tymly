/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const debug = require('debug')('flobot-solr-plugin')

const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const students = require('./fixtures/school-blueprint/models/students.json')
const studentsAndStaff = require('./fixtures/school-blueprint/test-resources/students-and-staff-models.json')

describe('flobot-solr-plugin tests', function () {
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
        blueprintPaths: [],
        config: {

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
    const studentsMappings = {
      'modelId': 'students',
      'attributeMapping': {
        'id': '\'student#\' || student_no',
        'actorName': 'first_name || \' \' || last_name',
        'characterName': '@characterName'
      }
    }

    const select = solrService.buildSelectStatement(ns, students, studentsMappings, solrFieldDefaults)
    debug(select)

    expect(select).to.be.a('string')
    expect(select).to.eql('SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_name AS character_name FROM solr_plugin_test.students')
  })

  it('should generate a SQL CREATE VIEW statement', () => {
    const studentsAndStaffMappings = [
      {
        'modelId': 'students',
        'attributeMapping': {
          'id': '\'student#\' || student_no',
          'actorName': 'first_name || \' \' || last_name',
          'characterName': '@characterName'
        }
      },
      {
        'modelId': 'staff',
        'attributeMapping': {
          'id': '\'staff#\' || staff_no',
          'actorName': 'first_name || \' \' || last_name',
          'characterName': 'character_first_name || \' \' || character_last_name'
        }
      }
    ]

    const sqlString = solrService.buildCreateViewStatement(
      ns, studentsAndStaff, studentsAndStaffMappings, solrFieldDefaults)
    debug(sqlString)

    expect(sqlString).to.be.a('string')
    expect(sqlString).to.eql('CREATE OR REPLACE VIEW solr_plugin_test.solr_data AS \n' +
      'SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_name AS character_name FROM solr_plugin_test.students\n' +
      'UNION\n' +
      'SELECT \'staff#\' || staff_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_first_name || \' \' || character_last_name AS character_name FROM solr_plugin_test.staff;')
  })

  it('should create test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/setup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should create a database view using the test resources', (done) => {
    const studentsAndStaffMappings = [
      {
        'modelId': 'students',
        'attributeMapping': {
          'id': '\'student#\' || student_no',
          'actorName': 'first_name || \' \' || last_name',
          'characterName': '@characterName'
        }
      },
      {
        'modelId': 'staff',
        'attributeMapping': {
          'id': '\'staff#\' || staff_no',
          'actorName': 'first_name || \' \' || last_name',
          'characterName': 'character_first_name || \' \' || character_last_name'
        }
      }
    ]

    const createViewStatement = solrService.buildCreateViewStatement(
      ns, studentsAndStaff, studentsAndStaffMappings, solrFieldDefaults)

    solrService.executeSQL(createViewStatement, function (err) {
      expect(err).to.eql(null)
      done()
    })
  })

  it('should return 19 rows when selecting from the view', (done) => {
    solrService.executeSQL(
      'SELECT * FROM solr_plugin_test.solr_data ORDER BY character_name ASC;',
      function (err, result) {
        expect(err).to.eql(null)
        expect(result.rowCount).to.eql(19)
        expect(result.rows[0].id).to.eql('staff#1')
        expect(result.rows[18].id).to.eql('staff#3')
        // debug(result)
        done()
      }
    )
  })

  it('should cleanup test resources', (done) => {
    sqlScriptRunner(
      './db-scripts/cleanup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})
