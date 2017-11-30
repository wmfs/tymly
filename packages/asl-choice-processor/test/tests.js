/* eslint-env mocha */
'use strict'
const chai = require('chai')
const expect = chai.expect

// As inspired-by: http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules

const choiceProcessor = require('./../lib')

describe('Choice tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('Should pick a simple state using booleanEquals', function () {
    const calculateNextState = choiceProcessor(
      {
        Choices: [
          {
            Variable: '$.foo',
            BooleanEquals: true,
            Next: 'FirstMatchState'
          },
          {
            Variable: '$.foo',
            BooleanEquals: false,
            Next: 'SecondMatchState'
          }
        ]
      }
    )
    expect(calculateNextState({foo: true})).to.equal('FirstMatchState')
    expect(calculateNextState({foo: false})).to.equal('SecondMatchState')
    expect(calculateNextState({foo: 'Unexpected!'})).to.equal(undefined)
    expect(calculateNextState({})).to.equal(undefined)
  })

  it('Should pick a simple state using NumericEquals', function () {
    const calculateNextState = choiceProcessor(
      {
        Choices: [
          {
            Variable: '$.foo',
            NumericEquals: 1,
            Next: 'FirstMatchState'
          },
          {
            Variable: '$.foo',
            NumericEquals: 2,
            Next: 'SecondMatchState'
          }
        ],
        Default: 'DefaultMatchState'
      }
    )
    expect(calculateNextState({foo: 1})).to.equal('FirstMatchState')
    expect(calculateNextState({foo: 2})).to.equal('SecondMatchState')
    expect(calculateNextState({foo: 3})).to.equal('DefaultMatchState')
  })
})
