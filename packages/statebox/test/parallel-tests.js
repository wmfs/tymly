/* eslint-env mocha */

// unless we introduce waits, then there is a danger of out
// branching state machines falling prey to race conditions
// and triggering state changes multiple times, with
// hilarious consequences

// these tests are intended to ensure that each parallel
// step triggers a single state change on completion

const Statebox = require('./../lib')
const expect = require('chai').expect

const eventLog = []

function clearEventLog () {
  while (eventLog.length) {
    eventLog.pop()
  } // while
} // clearEventLog

function msgClass (msg = 'Noop') {
  return class {
    run (event, context) {
      eventLog.push(msg)
      context.sendTaskSuccess({results: msg})
    } // run
  }
}

const Noop = msgClass()
const One = msgClass('one')
const Two = msgClass('two')
const Three = msgClass('three')
const Four = msgClass('four')

class Pause {
  run (event, context) {
    setTimeout(
      () => {
        eventLog.push('Pause')
        context.sendTaskSuccess({results: 'Pause'})
      },
      500
    )
  } // run
} // class Pause

const testMachines = [
  [ 'Slow single state machine',
    [ 'Pause' ],
    {
      'StartAt': 'HoldOnNow',
      'States': {
        'HoldOnNow': {
          'Type': 'Task',
          'Resource': 'module:pause',
          'End': true
        }
      }
    }
  ],
  [ 'Single state machine at the speed of a clock tick',
    [ 'Noop' ],
    {
      'StartAt': 'Zoom',
      'States': {
        'Zoom': {
          'Type': 'Task',
          'Resource': 'module:noop',
          'End': true
        }
      }
    }
  ],
  [ 'Branch then stop state machine',
    [ 'one', 'two' ],
    {
      'StartAt': 'Split',
      'States': {
        'Split': {
          'Type': 'Parallel',
          'Branches': [
            {
              'StartAt': 'zoom-branch-a',
              'States': {
                'zoom-branch-a': {
                  'Type': 'Task',
                  'Resource': 'module:one',
                  'End': true
                }
              }
            },
            {
              'StartAt': 'zoom-branch-b',
              'States': {
                'zoom-branch-b': {
                  'Type': 'Task',
                  'Resource': 'module:two',
                  'End': true
                }
              }
            }
          ],
          'End': true
        }
      }
    }
  ],
  [ 'Branch then join state machine',
    [ 'one', 'two', 'Noop' ],
    {
      'StartAt': 'Split',
      'States': {
        'Split': {
          'Type': 'Parallel',
          'Branches': [
            {
              'StartAt': 'zoom-branch-a',
              'States': {
                'zoom-branch-a': {
                  'Type': 'Task',
                  'Resource': 'module:one',
                  'End': true
                }
              }
            },
            {
              'StartAt': 'zoom-branch-b',
              'States': {
                'zoom-branch-b': {
                  'Type': 'Task',
                  'Resource': 'module:two',
                  'End': true
                }
              }
            }
          ],
          'Next': 'Last'
        },
        'Last': {
          'Type': 'Task',
          'Resource': 'module:noop',
          'End': true
        }
      }
    }
  ],
  [ 'Branch A is slow, Branch B and C are quick',
    [ 'one', 'two', 'Pause', 'Noop' ],
    {
      'StartAt': 'Split',
      'States': {
        'Split': {
          'Type': 'Parallel',
          'Branches': [
            {
              'StartAt': 'branch-a',
              'States': {
                'branch-a': {
                  'Type': 'Task',
                  'Resource': 'module:pause',
                  'End': true
                }
              }
            },
            {
              'StartAt': 'zoom-branch-b',
              'States': {
                'zoom-branch-b': {
                  'Type': 'Task',
                  'Resource': 'module:one',
                  'End': true
                }
              }
            },
            {
              'StartAt': 'zoom-branch-c',
              'States': {
                'zoom-branch-c': {
                  'Type': 'Task',
                  'Resource': 'module:two',
                  'End': true
                }
              }
            }
          ],
          'Next': 'Last'
        },
        'Last': {
          'Type': 'Task',
          'Resource': 'module:noop',
          'End': true
        }
      }
    }
  ],
  [ 'Branch A is slow, Branch B is long',
    [ 'Noop', 'one', 'two', 'three', 'four', 'Pause', 'Noop' ],
    {
      'StartAt': 'Header',
      'States': {
        'Header': {
          'Type': 'Task',
          'Resource': 'module:noop',
          'Next': 'Split'
        },
        'Split': {
          'Type': 'Parallel',
          'Branches': [
            {
              'StartAt': 'branch-a',
              'States': {
                'branch-a': {
                  'Type': 'Task',
                  'Resource': 'module:pause',
                  'End': true
                }
              }
            },
            {
              'StartAt': 'branch-b',
              'States': {
                'branch-b': {
                  'Type': 'Task',
                  'Resource': 'module:one',
                  'Next': 'b-b'
                },
                'b-b': {
                  'Type': 'Task',
                  'Resource': 'module:two',
                  'Next': 'b-c'
                },
                'b-c': {
                  'Type': 'Task',
                  'Resource': 'module:three',
                  'Next': 'b-d'
                },
                'b-d': {
                  'Type': 'Task',
                  'Resource': 'module:four',
                  'End': true
                }
              }
            }
          ],
          'Next': 'Last'
        },
        'Last': {
          'Type': 'Task',
          'Resource': 'module:noop',
          'End': true
        }
      }
    }
  ]
]

for (const [machineName, expectedResult, stateMachine] of testMachines) {
  describe(machineName, () => {
    const statebox = new Statebox()

    statebox.createModuleResource('noop', Noop)
    statebox.createModuleResource('one', One)
    statebox.createModuleResource('two', Two)
    statebox.createModuleResource('three', Three)
    statebox.createModuleResource('four', Four)
    statebox.createModuleResource('pause', Pause)

    let execution

    it('start', async () => {
      clearEventLog()
      const machines = { [machineName]: stateMachine }
      await statebox.createStateMachinesP(machines, {})

      execution = await statebox.startExecutionP({}, machineName, {})
    })

    it('complete', async () => {
      await statebox.waitUntilStoppedRunningP(
        execution.executionName
      )
      expect(eventLog).to.eql(expectedResult)
    })
  })
}
