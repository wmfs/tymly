'use strict'

module.exports = {
  description: 'Runs state machines defined in Amazon States Language',
  blueprintDirs: {
    'state-machines': 'Each JSON file inside this sub-directory will be used to conjure a State Machine for orchestrating a workflow. Tymly uses the open [Amazon State Language](https://states-language.net/spec.html) to describe State Machines.'
  }
}
