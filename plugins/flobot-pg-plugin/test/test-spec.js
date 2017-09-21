/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')

describe('PostgreSQL storage tests', function () {
  this.timeout(5000)

  let flobotsService
  let registryService
  let tagsService
  let client

  it('should create some flobot services to test PostgreSQL storage', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/people-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/space-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/test1-blueprint')
        ],

        config: {
        }
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        client = flobotServices.storage.client
        flobotsService = flobotServices.flobots
        registryService = flobotServices.registry
        tagsService = flobotServices.tags
        done()
      }
    )
  })

  it('Should initially drop-cascade the pg_model_test schema, if one exists', function (done) {
    sqlScriptRunner(
      [
        'install.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should find the simple-storage flow by id', function () {
    flobotsService.findFlowById('fbotTest_people_1_0',
      function (err, flow) {
        expect(err).to.eql(null)
        expect(flow.flowId).to.eql('fbotTest_people_1_0')
      }
    )
  })

  it('should start (and complete) a simple-storage Flobot', function (done) {
    flobotsService.startNewFlobot(
      'fbotTest_people_1_0',
      {
        data: {
          homer: {
            employeeNo: 1,
            firstName: 'Homer',
            lastName: 'Simpson',
            age: 39
          }
        }
      },
      function (err, homer) {
        expect(err).to.eql(null)
        expect(homer.flobotId).to.be.a('string')
        expect(homer.flowId).to.eql('fbotTest_people_1_0')
        expect(homer.stateId).to.eql('findingById')
        expect(homer.status).to.eql('finished')

        expect(homer.ctx.homer).to.eql(
          {
            employeeNo: 1,
            firstName: 'Homer',
            lastName: 'Simpson',
            age: 39
          }
        )
        expect(homer.ctx.foundHomer.employeeNo).to.eql('1')
        expect(homer.ctx.foundHomer.firstName).to.eql('Homer')
        expect(homer.ctx.foundHomer.lastName).to.eql('Simpson')
        expect(homer.ctx.foundHomer.age).to.eql(39)
        done()
      }
    )
  })

  it('should ensure the registry service (which has JSONB columns) still works', function () {
    expect(registryService.registry.fbotTest_planetSizeUnit.value).to.eql('km')
  })

  it('should ensure the tags service (which has JSONB columns) still works', function () {
    expect(tagsService.tags).to.eql(
      {
        gas: {
          tag: 'gas',
          label: 'Gas',
          styling: {
            'background-color': '#80C342'
          }
        },
        terrestrial: {
          tag: 'terrestrial',
          label: 'terrestrial',
          styling: {
            'background-color': '#5F5F5F '
          }
        }
      }
    )
  })

  it('Should uninstall test schemas', function (done) {
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

  it('Should end db client', function () {
    client.end()
  })
})
