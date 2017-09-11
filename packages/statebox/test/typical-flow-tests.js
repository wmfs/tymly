/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect

// Modules
const helloWorldFunction = require('./fixtures/functions/hello-world')
const helloFunction = require('./fixtures/functions/hello')
const worldFunction = require('./fixtures/functions/world')
const addFunction = require('./fixtures/functions/add')
const subtractFunction = require('./fixtures/functions/subtract')
const failureFunction = require('./fixtures/functions/failure')
const a = require('./fixtures/functions/a')
const b = require('./fixtures/functions/b')
const c = require('./fixtures/functions/c')
const d = require('./fixtures/functions/d')
const e = require('./fixtures/functions/e')
const f = require('./fixtures/functions/f')
const g = require('./fixtures/functions/g')

// stateMachines
const helloWorldStateMachine = require('./fixtures/state-machines/hello-world.json')
const helloThenWorldStateMachine = require('./fixtures/state-machines/hello-then-world.json')
const helloThenFailureStateMachine = require('./fixtures/state-machines/hello-then-failure.json')
const calculatorStateMachine = require('./fixtures/state-machines/calculator.json')
const calculatorWithInputPathsStateMachine = require('./fixtures/state-machines/calculator-with-input-paths.json')
const passStateMachine = require('./fixtures/state-machines/pass-state-machine.json')
const failStateMachine = require('./fixtures/state-machines/fail-state-machine.json')
const parallelStateMachine = require('./fixtures/state-machines/parallel-state-machine.json')
const parallelFailStateMachine = require('./fixtures/state-machines/parallel-fail-state-machine.json')

const Statebox = require('./../lib')

describe('Simple stateMachine test', function () {
  this.timeout(5000)
  let statebox
  let executionName

  it('should create a new Statebox instance', function () {
    statebox = new Statebox()
  })

  it('should add some modules', function () {
    statebox.createModuleResource('helloWorld', helloWorldFunction)
    statebox.createModuleResource('hello', helloFunction)
    statebox.createModuleResource('world', worldFunction)
    statebox.createModuleResource('add', addFunction)
    statebox.createModuleResource('subtract', subtractFunction)
    statebox.createModuleResource('failure', failureFunction)
    statebox.createModuleResource('a', a)
    statebox.createModuleResource('b', b)
    statebox.createModuleResource('c', c)
    statebox.createModuleResource('d', d)
    statebox.createModuleResource('e', e)
    statebox.createModuleResource('f', f)
    statebox.createModuleResource('g', g)
  })

  it('should create a new helloWorld stateMachine', function () {
    statebox.createStateMachine(
      'helloWorld',
      helloWorldStateMachine
    )
  })

  it('should create a new helloThenWorld stateMachine', function () {
    statebox.createStateMachine(
      'helloThenWorld',
      helloThenWorldStateMachine
    )
  })

  it('should create a new helloThenFailure state machine', function () {
    statebox.createStateMachine(
      'helloThenFailure',
      helloThenFailureStateMachine
    )
  })

  it('should create a new calculator stateMachine', function () {
    statebox.createStateMachine(
      'calculator',
      calculatorStateMachine
    )
  })

  it('should execute helloWorld', function (done) {
    statebox.startExecution(
      {},  // input
      'helloWorld', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete helloWorld execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('helloWorld')
        expect(executionDescription.currentStateName).to.eql('Hello World')
        done()
      }
    )
  })

  it('should execute helloThenWorld', function (done) {
    statebox.startExecution(
      {},  // input
      'helloThenWorld', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete helloThenWorld execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('helloThenWorld')
        expect(executionDescription.currentStateName).to.eql('World')
        done()
      }
    )
  })

  it('should execute helloThenFailure', function (done) {
    statebox.startExecution(
      {},  // input
      'helloThenFailure', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully fail helloThenFailure execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.stateMachineName).to.eql('helloThenFailure')
        expect(executionDescription.currentStateName).to.eql('Failure')
        expect(executionDescription.errorCode).to.eql('SomethingBadHappened')
        expect(executionDescription.errorMessage).to.eql('But at least it was expected')
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
      'calculator', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete calculator execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('calculator')
        expect(executionDescription.currentStateName).to.eql('Add')
        expect(executionDescription.ctx.result).to.eql(5)
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
      'calculator', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete calculator execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('calculator')
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.ctx.result).to.eql(1)
        done()
      }
    )
  })

  it('should create a new calculator (with input paths) stateMachine', function () {
    statebox.createStateMachine(
      'calculatorWithInputPathsStateMachine',
      calculatorWithInputPathsStateMachine
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
      'calculatorWithInputPathsStateMachine', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete calculator (with input paths) execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPathsStateMachine')
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.ctx.result).to.eql(1)
        done()
      }
    )
  })

  it('should prove describeExecution works as expected', function (done) {
    statebox.describeExecution(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPathsStateMachine')
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.ctx.result).to.eql(1)
        done()
      }
    )
  })

  it('should create a new pass stateMachine ', function () {
    statebox.createStateMachine(
      'passStateMachine',
      passStateMachine
    )
  })

  it('should execute pass stateMachine', function (done) {
    statebox.startExecution(
      {
        georefOf: 'Home'
      },
      'passStateMachine', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully complete passStateMachine execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('passStateMachine')
        expect(executionDescription.currentStateName).to.eql('PassState')
        expect(executionDescription.ctx).to.eql(
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

  it('should create a new fail stateMachine ', function () {
    statebox.createStateMachine(
      'failStateMachine',
      failStateMachine
    )
  })

  it('should execute fail stateMachine', function (done) {
    statebox.startExecution(
      {},
      'failStateMachine', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should respond with a failed execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.stateMachineName).to.eql('failStateMachine')
        expect(executionDescription.currentStateName).to.eql('FailState')
        expect(executionDescription.errorMessage).to.eql('Invalid response.')
        expect(executionDescription.errorCode).to.eql('ErrorA')
        done()
      }
    )
  })

  it('should create a new parallel stateMachine ', function () {
    //
    //                        |
    //                    Parallel1
    //                    |       |
    //                    A       B
    //                (+4 secs)   |
    //                 |      Parallel2
    //                 |      |       |
    //                 |      C       D
    //                 |  (+2 secs)   |
    //                 |      |       E
    //                 |      |       |
    //                 |      ---------
    //                 |          |
    //                 |          F
    //                 |          |
    //                 ------------
    //                       |
    //                       G
    // Expected order [Parallel1, B, Parallel2, D, E, C, F, A, G ]

    statebox.createStateMachine(
      'parallelStateMachine',
      parallelStateMachine
    )
  })

  it('should execute parallel stateMachine', function (done) {
    statebox.startExecution(
      {
        results: []
      },
      'parallelStateMachine', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should respond with a successful parallel execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('parallelStateMachine')
        expect(executionDescription.currentStateName).to.eql('G')
        done()
      }
    )
  })

  it('should create a new parallel-failing stateMachine', function () {
    statebox.createStateMachine(
      'parallelFailStateMachine',
      parallelFailStateMachine
    )
  })

  it('should execute parallel-failing stateMachine', function (done) {
    statebox.startExecution(
      {
        results: []
      },
      'parallelFailStateMachine', // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should respond with a failed parallel execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.stateMachineName).to.eql('parallelFailStateMachine')
        expect(executionDescription.currentStateName).to.eql('Parallel1')
        expect(executionDescription.errorCause).to.eql('States.BranchFailed')
        expect(executionDescription.errorCode).to.eql('Failed because a state in a parallel branch has failed')
        done()
      }
    )
  })
})
