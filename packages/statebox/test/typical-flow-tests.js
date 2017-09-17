/* eslint-env mocha */
'use strict'

const _ = require('lodash')
const chai = require('chai')
const expect = chai.expect

// Module Resources
const moduleResources = require('./fixtures/module-resources')

// stateMachines
const stateMachines = require('./fixtures/state-machines')

const Statebox = require('./../lib')

describe('Simple stateMachine test', function () {
  this.timeout(5000)
  let statebox
  let executionName

  it('should create a new Statebox instance', function () {
    statebox = new Statebox()
  })

  it('should add some module resources', function () {
    statebox.createModuleResources(moduleResources)
  })

  it('should add some state machines', function (done) {
    statebox.createStateMachines(
      stateMachines,
      {},
      function (err) {
        expect(err).to.eql(null)
        done()
      }
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

  it('should execute calculator (with input paths)', function (done) {
    statebox.startExecution(
      {
        numbers: {
          number1: 3,
          number2: 2
        },
        operator: '-'
      },  // input
      'calculatorWithInputPaths', // state machine name
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
        expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPaths')
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
        expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPaths')
        expect(executionDescription.currentStateName).to.eql('Subtract')
        expect(executionDescription.ctx.result).to.eql(1)
        done()
      }
    )
  })

  it('should execute pass stateMachine', function (done) {
    statebox.startExecution(
      {
        georefOf: 'Home'
      },
      'pass', // state machine name
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
        expect(executionDescription.stateMachineName).to.eql('pass')
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

  it('should execute fail stateMachine', function (done) {
    statebox.startExecution(
      {},
      'fail', // state machine name
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
        expect(executionDescription.stateMachineName).to.eql('fail')
        expect(executionDescription.currentStateName).to.eql('FailState')
        expect(executionDescription.errorMessage).to.eql('Invalid response.')
        expect(executionDescription.errorCode).to.eql('ErrorA')
        done()
      }
    )
  })

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

  it('should execute parallel stateMachine', function (done) {
    statebox.startExecution(
      {
        results: []
      },
      'parallel', // state machine name
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
        expect(executionDescription.stateMachineName).to.eql('parallel')
        expect(executionDescription.currentStateName).to.eql('G')
        done()
      }
    )
  })

  it('should execute parallel-failing stateMachine', function (done) {
    statebox.startExecution(
      {
        results: []
      },
      'parallelFail', // state machine name
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
        expect(executionDescription.stateMachineName).to.eql('parallelFail')
        expect(executionDescription.currentStateName).to.eql('Parallel1')
        expect(executionDescription.errorCause).to.eql('States.BranchFailed')
        expect(executionDescription.errorCode).to.eql('Failed because a state in a parallel branch has failed')
        done()
      }
    )
  })
})
