'use strict'

const YamlToForm = require('./yaml-to-form.js')
const YamlToStateMachine = require('./yaml-to-state-machine.js')
const YamlToModel = require('./yaml-to-model.js')

module.exports = function (options, callback) {
  const yamlToForm = new YamlToForm()
  const yamlToStateMachine = new YamlToStateMachine()
  const yamlToModel = new YamlToModel()

  yamlToForm.generateForm(options, (err, form) => {
    if (err) return callback(err)
    yamlToStateMachine.generateStateMachine(options, (err, stateMachine) => {
      if (err) return callback(err)
      yamlToModel.generateModel(options, (err, model) => {
        if (err) return callback(err)
        callback(null, {
          form: form,
          stateMachine: stateMachine,
          model: model
        })
      })
    })
  })
}
