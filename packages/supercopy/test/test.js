/* eslint-env mocha */

'use strict'

const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const expect = require('chai').expect
const pg = require('pg')
const supercopy = require('./../lib')
const path = require('path')

describe('Run some basic tests', function () {
  const connectionString = process.env.PG_CONNECTION_STRING
  let client

  it('Should create a new pg client', function () {
    client = new pg.Client(connectionString)
    client.connect()
  })

  it('Should initially drop-cascade the pg_model_test schema, if one exists', function (done) {
    sqlScriptRunner(
      [
        'uninstall.sql',
        'install.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should supercopy some people', function (done) {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/examples/people'),
        topDownTableOrder: ['children', 'adults'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        debug: true
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should return correctly modified adult rows', function (done) {
    client.query(
      'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            { adult_no: 40, first_name: 'Marge', last_name: 'Simpson' },
            { adult_no: 60, first_name: 'Abe', last_name: 'Simpson' },
            { adult_no: 80, first_name: 'Ned', last_name: 'Flanders' }
          ]
        )
        done()
      }
    )
  })

  it('Should return correctly modified children rows', function (done) {
    client.query(
        'select child_no,first_name,last_name from supercopy_test.children order by child_no',
        function (err, result) {
          expect(err).to.equal(null)
          expect(result.rows).to.eql(
            [
              {'child_no': 10, 'first_name': 'Lisa', 'last_name': 'Simpson'},
              {'child_no': 30, 'first_name': 'Bart', 'last_name': 'Simpson'},
              {'child_no': 70, 'first_name': 'Milhouse', 'last_name': 'Van Houten'}
            ]
          )
          done()
        }
    )
  })

  it('Should fail supercopy-if some bad-people files', function (done) {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/examples/people-with-an-error'),
        topDownTableOrder: ['children', 'adults'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        debug: true
      },
      function (err) {
        expect(err).to.not.equal(null)
        done()
      }
    )
  })

  it('Should supercopy some people, truncating the tables first', function (done) {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/examples/people'),
        topDownTableOrder: ['children', 'adults'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        truncateFirstTables: ['children', 'adults'],
        debug: true
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should return correctly modified adult rows (truncated)', function (done) {
    client.query(
      'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            { adult_no: 40, first_name: 'Marge', last_name: 'Simpson' },
            { adult_no: 80, first_name: 'Ned', last_name: 'Flanders' }
          ]
        )
        done()
      }
    )
  })

  it('Should return correctly modified children rows (truncated)', function (done) {
    client.query(
      'select child_no,first_name,last_name from supercopy_test.children order by child_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            {'child_no': 30, 'first_name': 'Bart', 'last_name': 'Simpson'}
          ]
        )
        done()
      }
    )
  })

  it('Should finally drop-cascade the pg_model_test schema', function (done) {
    sqlScriptRunner(
      [
        'uninstall.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})
