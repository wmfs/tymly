/* eslint-env mocha */
'use strict'

const Statebox = require('./../lib')
const process = require('process')
const pg = require('pg')
const chai = require('chai')
const expect = chai.expect
const TEST_DB_SCHEMA_NAME = 'statebox_test'

// Functions
const helloWorldFunction = require('./fixtures/functions/hello-world')
const helloFunction = require('./fixtures/functions/hello')
const worldFunction = require('./fixtures/functions/world')
const addFunction = require('./fixtures/functions/add')
const subtractFunction = require('./fixtures/functions/subtract')

// Flows
const helloWorldFlow = require('./fixtures/flows/hello-world.json')
const helloThenWorldFlow = require('./fixtures/flows/hello-then-world.json')
const calculatorFlow = require('./fixtures/flows/calculator.json')

const waitUntilExecutionStatus = require('./utils/wait-until-execution-status')

describe('Simple flow test', function () {
  this.timeout(5000)
  let client
  let statebox
  let executionName

  it('Should create a new pg client', function () {
    const pgConnectionString = process.env.PG_CONNECTION_STRING
    client = new pg.Client(pgConnectionString)
    client.connect()
  })

  it('should boot Statebox', function (done) {
    statebox = new Statebox()
    statebox.boot(
      {
        schemaName: TEST_DB_SCHEMA_NAME,
        client: client
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should add some functions', function () {
    statebox.createFunctionResource('helloWorld', helloWorldFunction)
    statebox.createFunctionResource('hello', helloFunction)
    statebox.createFunctionResource('world', worldFunction)
    statebox.createFunctionResource('add', addFunction)
    statebox.createFunctionResource('subtract', subtractFunction)
  })

  it('should create a new helloWorld flow', function (done) {
    statebox.createFlow(
      'helloWorld',
      helloWorldFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should create a new helloThenWorld flow', function (done) {
    statebox.createFlow(
      'helloThenWorld',
      helloThenWorldFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should create a new calculator flow', function (done) {
    statebox.createFlow(
      'calculator',
      calculatorFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute helloWorld', function (done) {
    statebox.startExecution(
      {},  // input
      'helloWorld', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete helloWorld execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.flowName).to.eql('helloWorld')
        expect(executionDescription.currentStateName).to.eql('Hello World')
        expect(executionDescription.output).to.eql({})
        done()
      }
    )
  })

  it('should execute helloThenWorld', function (done) {
    statebox.startExecution(
      {},  // input
      'helloThenWorld', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete helloThenWorld execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.flowName).to.eql('helloThenWorld')
        expect(executionDescription.currentStateName).to.eql('World')
        expect(executionDescription.output).to.eql({})
        done()
      }
    )
  })

  it('should execute calculator', function (done) {
    statebox.startExecution(
      {
        number1: 3,
        operator: '+',
        number2: 2
      },  // input
      'calculator', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete calculator execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.flowName).to.eql('calculator')
        expect(executionDescription.currentStateName).to.eql('Add')
        expect(executionDescription.output).to.eql({result: 5})
        done()
      }
    )
  })

  it('Should end db client', function () {
    client.end()
  })
})
