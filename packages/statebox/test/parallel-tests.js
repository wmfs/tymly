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

class Noop {
  constructor(msg = 'Noop') {
    this.msg = msg
  }
  run (event, context) {
    eventLog.push(this.msg)
    context.sendTaskSuccess({results: this.msg})
  } // run
} // Noop

class Wait {
  run (event, context) {
    eventLog.push('Wait')
    setTimeout(
      () => context.sendTaskSuccess({results: 'Wait'}),
      500
    )
  } // run
} // class Wait

const testMachines = [
  [ 'Slow single state machine',
    [ 'Wait' ],
    {
      'StartAt': 'HoldOnNow',
      'States': {
        'HoldOnNow': {
          'Type': 'Task',
          'Resource': 'module:wait',
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
    [ 'one', 'two', 'Noop'],
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
  ]
]

for (const [machineName, expectedResult, stateMachine] of testMachines) {
  describe(machineName, () => {
    const statebox = new Statebox()

    statebox.createModuleResource('noop', new Noop())
    statebox.createModuleResource('one', new Noop('one'))
    statebox.createModuleResource('two', new Noop('two'))
    statebox.createModuleResource('wait', new Wait())

    let execution

    it('start', async () => {
      clearEventLog()
      statebox.createStateMachine(machineName, stateMachine)

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
