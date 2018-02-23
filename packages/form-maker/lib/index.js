'use strict'

const YamlToForm = require('./yaml-to-form.js')
const YamlToStateMachine = require('./yaml-to-state-machine.js')

module.exports = function (options, callback) {
  const yamlToForm = new YamlToForm()
  const yamlToStateMachine = new YamlToStateMachine()

  yamlToForm.generateForm(options, (err, form) => {
    if (err) return callback(err)
    yamlToStateMachine.generateStateMachine(options, (err, stateMachine) => {
      if (err) return callback(err)
      callback(null, {form: form, stateMachine: stateMachine})
    })
  })
}
