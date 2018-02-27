/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const fs = require('fs')

describe('Form Service tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, client, forms, storage, statebox

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, 'fixtures', 'people-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        storage = tymlyServices.storage
        forms = tymlyServices.forms
        client = tymlyServices.storage.client
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should check the properties of the forms', (done) => {
    expect(Object.keys(forms.forms).includes('test_people')).to.eql(true)
    done()
  })

  it('should check the properties of the storage model', (done) => {
    expect(Object.keys(storage.models).includes('test_people')).to.eql(true)
    expect(storage.models['test_people'].propertyIds).to.eql(['firstName',
      'lastName',
      'age',
      'dateOfBirth',
      'homeAddress',
      'avatar',
      'favouriteColour',
      'id'])
    done()
  })

  it('should check the state machine', (done) => {
    expect(statebox.statebox.options.blueprintComponents.stateMachines['test_people_1_0'].Comment).to.eql('A bunch of people.')
    done()
  })

  it('should clean up the generated files', (done) => {
    fs.unlinkSync(path.resolve(__dirname, 'fixtures', 'people-blueprint', 'forms', 'people.json'))
    fs.unlinkSync(path.resolve(__dirname, 'fixtures', 'people-blueprint', 'models', 'people.json'))
    fs.unlinkSync(path.resolve(__dirname, 'fixtures', 'people-blueprint', 'state-machines', 'people.json'))
    fs.rmdirSync(path.resolve(__dirname, 'fixtures', 'people-blueprint', 'models'))
    fs.rmdirSync(path.resolve(__dirname, 'fixtures', 'people-blueprint', 'state-machines'))
    done()
  })

  it('should clean up the test resources', () => {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should shut down Tymly nicely', async () => {
    await tymlyService.shutdown()
  })
})
