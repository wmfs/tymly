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
const a = require('./fixtures/functions/a')
const b = require('./fixtures/functions/b')
const c = require('./fixtures/functions/c')
const d = require('./fixtures/functions/d')
const e = require('./fixtures/functions/e')
const f = require('./fixtures/functions/f')
const g = require('./fixtures/functions/g')
const h = require('./fixtures/functions/h')

// Flows
const helloWorldFlow = require('./fixtures/flows/hello-world.json')
const helloThenWorldFlow = require('./fixtures/flows/hello-then-world.json')
const calculatorFlow = require('./fixtures/flows/calculator.json')
const calculatorWithInputPathsFlow = require('./fixtures/flows/calculator-with-input-paths.json')
const passFlow = require('./fixtures/flows/pass-flow.json')
const failFlow = require('./fixtures/flows/fail-flow.json')
const parallelFlow = require('./fixtures/flows/parallel-flow.json')

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

  it('should add some modules', function () {
    statebox.createModuleResource('helloWorld', helloWorldFunction)
    statebox.createModuleResource('hello', helloFunction)
    statebox.createModuleResource('world', worldFunction)
    statebox.createModuleResource('add', addFunction)
    statebox.createModuleResource('subtract', subtractFunction)
    statebox.createModuleResource('a', a)
    statebox.createModuleResource('b', b)
    statebox.createModuleResource('c', c)
    statebox.createModuleResource('d', d)
    statebox.createModuleResource('e', e)
    statebox.createModuleResource('f', f)
    statebox.createModuleResource('g', g)
    statebox.createModuleResource('h', h)
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
        expect(executionDescription.input.result).to.eql(5)
        done()
      }
    )
  })

  it('should execute calculator', function (done) {
    statebox.startExecution(
      {
        number1: 3,
        operator: '-',
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
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.input.result).to.eql(1)
        done()
      }
    )
  })

  it('should create a new calculator (with input paths) flow', function (done) {
    statebox.createFlow(
      'calculatorWithInputPathsFlow',
      calculatorWithInputPathsFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute calculator (with input paths)', function (done) {
    statebox.startExecution(
      {
        numbers: {
          number1: 3,
          number2: 2
        },
        operator: '-'
      },  // input
      'calculatorWithInputPathsFlow', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete calculator (with input paths) execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.flowName).to.eql('calculatorWithInputPathsFlow')
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.input.result).to.eql(1)
        done()
      }
    )
  })

  it('should create a new pass flow ', function (done) {
    statebox.createFlow(
      'passFlow',
      passFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute pass flow', function (done) {
    statebox.startExecution(
      {
        georefOf: 'Home'
      },
      'passFlow', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete passFlow execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.flowName).to.eql('passFlow')
        expect(executionDescription.currentStateName).to.eql('PassState')
        expect(executionDescription.input).to.eql(
          {
            georefOf: 'Home',
            coords: {
              'x-datum': 0,
              'y-datum': 600
            }
          }
        )
        done()
      }
    )
  })

  it('should create a new fail flow ', function (done) {
    statebox.createFlow(
      'failFlow',
      failFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute fail flow', function (done) {
    statebox.startExecution(
      {},
      'failFlow', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should respond with a failed execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'FAILED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.flowName).to.eql('failFlow')
        expect(executionDescription.currentStateName).to.eql('FailState')
        expect(executionDescription.errorCause).to.eql('Invalid response.')
        expect(executionDescription.errorCode).to.eql('ErrorA')
        done()
      }
    )
  })

  it('should create a new parallel flow ', function (done) {
    statebox.createFlow(
      'parallelFlow',
      parallelFlow,
      function (err, info) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute parallel flow', function (done) {
    statebox.startExecution(
      {
        results: []
      },
      'parallelFlow', // flowName
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should respond with a successful parallel execution', function (done) {
    waitUntilExecutionStatus(
      executionName,
      'SUCCEEDED',
      statebox,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // expect(executionDescription.status).to.eql('FAILED')
        // expect(executionDescription.flowName).to.eql('failFlow')
        // expect(executionDescription.currentStateName).to.eql('FailState')
        // expect(executionDescription.errorCause).to.eql('Invalid response.')
        // expect(executionDescription.errorCode).to.eql('ErrorA')
        done()
      }
    )
  })

  it('Should end db client', function () {
    client.end()
  })
})
