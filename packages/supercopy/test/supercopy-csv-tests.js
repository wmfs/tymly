/* eslint-env mocha */

'use strict'

const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const expect = require('chai').expect
const pg = require('pg')
const supercopy = require('./../lib')
const path = require('path')

describe('Run some basic tests', () => {
  const connectionString = process.env.PG_CONNECTION_STRING
  let client

  it('Should create a new pg client', () => {
    client = new pg.Client(connectionString)
    client.connect()
  })

  it('Should load some test data', (done) => {
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

  it('Should supercopy some people', (done) => {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input-data/people'),
        topDownTableOrder: ['adults', 'children'],
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

  it('Should return correctly modified adult rows', (done) => {
    client.query(
      'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            { adult_no: 10, first_name: 'Homer', last_name: 'Simpson' },
            { adult_no: 20, first_name: 'Marge', last_name: 'Simpson' },
            { adult_no: 30, first_name: 'Maud', last_name: 'Flanders' },
            { adult_no: 40, first_name: 'Ned', last_name: 'Flanders' },
            { adult_no: 50, first_name: 'Seymour', last_name: 'Skinner' },
            { adult_no: 60, first_name: 'Charles', last_name: 'Burns' },
            { adult_no: 80, first_name: 'Clancy', last_name: 'Wiggum' },
            { adult_no: 90, first_name: 'Abraham', last_name: 'Simpson' },
            { adult_no: 100, first_name: 'Mona', last_name: 'Simpson' }
          ]
        )
        done()
      }
    )
  })

  it('Should return correctly modified children rows', (done) => {
    client.query(
      'select child_no,first_name,last_name from supercopy_test.children order by child_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            {'child_no': 10, 'first_name': 'Lisa', 'last_name': 'Simpson'},
            {'child_no': 20, 'first_name': 'Bart', 'last_name': 'Simpson'},
            {'child_no': 30, 'first_name': 'Maggie', 'last_name': 'Simpson'},
            {'child_no': 40, 'first_name': 'Rod', 'last_name': 'Flanders'},
            {'child_no': 50, 'first_name': 'Todd', 'last_name': 'Flanders'},
            {'child_no': 60, 'first_name': 'Nelson', 'last_name': 'Muntz'},
            {'child_no': 70, 'first_name': 'Milhouse', 'last_name': 'Van Houten'}
          ]
        )
        done()
      }
    )
  })

  it('Should fail supercopy-if some bad-people files', (done) => {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input-data/people-with-an-error'),
        topDownTableOrder: ['adults', 'children'],
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

  it('Should supercopy some people, truncating the tables first', (done) => {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input-data/people'),
        topDownTableOrder: ['adults', 'children'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        truncateTables: true,
        debug: true
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should return correctly modified adult rows (truncated)', (done) => {
    client.query(
      'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            { adult_no: 30, first_name: 'Maud', last_name: 'Flanders' },
            { adult_no: 40, first_name: 'Ned', last_name: 'Flanders' },
            { adult_no: 80, first_name: 'Clancy', last_name: 'Wiggum' },
            { adult_no: 90, first_name: 'Abraham', last_name: 'Simpson' },
            { adult_no: 100, first_name: 'Mona', last_name: 'Simpson' }
          ]
        )
        done()
      }
    )
  })

  it('Should return correctly modified children rows (truncated)', (done) => {
    client.query(
      'select child_no,first_name,last_name from supercopy_test.children order by child_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            {'child_no': 50, 'first_name': 'Todd', 'last_name': 'Flanders'},
            {'child_no': 70, 'first_name': 'Milhouse', 'last_name': 'Van Houten'}
          ]
        )
        done()
      }
    )
  })

  it('Should cleanup the test data', (done) => {
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
