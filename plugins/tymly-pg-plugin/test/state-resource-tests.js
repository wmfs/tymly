/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const OUTPUT_DIR_PATH = path.resolve(__dirname, './output')
let client

describe('Importing CSV Tests', function () {
  this.timeout(5000)
  const STATE_MACHINE_NAME = 'tymlyTest_importCsv_1_0'
  let statebox

  it('should create some tymly services to test PostgreSQL storage', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ],

        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        client = tymlyServices.storage.client
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should execute importingCsvFiles', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.equal('ImportingCsvFiles')
        done()
      }
    )
  })

  it('should check the animals have been added', function (done) {
    client.query(
      'select * from tymly_test.animal_with_age',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows[0].animal).to.eql('cat')
          expect(result.rows[1].animal).to.eql('dog')
          expect(result.rows[2].animal).to.eql('mouse')

          expect(result.rows[0].colour).to.eql('black')
          expect(result.rows[1].colour).to.eql('brown')
          expect(result.rows[2].colour).to.eql('grey')

          expect(result.rows[0].age).to.eql(2)
          expect(result.rows[1].age).to.eql(6)
          expect(result.rows[2].age).to.eql(3)
          done()
        }
      }
    )
  })
})

describe('Synchronizing Table tests', function () {
  this.timeout(5000)
  const STATE_MACHINE_NAME = 'tymlyTest_syncAnimal_1_0'
  let statebox

  it('should create some tymly services to test PostgreSQL storage', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ],

        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        client = tymlyServices.storage.client
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should execute synchronizingTable', function (done) {
    statebox.startExecution(
      {
        outputDir: OUTPUT_DIR_PATH
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.equal('SynchronizingTable')
        done()
      }
    )
  })

  it('should check the animals have been added and converted', function (done) {
    client.query(
      'select * from tymly_test.animal_with_year',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows[0].animal).to.eql('dog')
          expect(result.rows[1].animal).to.eql('mouse')
          expect(result.rows[2].animal).to.eql('cat')

          expect(result.rows[0].colour).to.eql('brown')
          expect(result.rows[1].colour).to.eql('grey')
          expect(result.rows[2].colour).to.eql('black')

          expect(result.rows[0]['year_born']).to.eql(2011)
          expect(result.rows[1]['year_born']).to.eql(2014)
          expect(result.rows[2]['year_born']).to.eql(2015)
          done()
        }
      }
    )
  })
})

describe('Clean up', function () {
  it('should remove output directory now tests are complete', function (done) {
    if (fs.existsSync(OUTPUT_DIR_PATH)) {
      rimraf(OUTPUT_DIR_PATH, {}, done)
    } else {
      done()
    }
  })

  it('should uninstall test schemas', function (done) {
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
