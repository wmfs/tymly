'use strict'

const schema = require('./schema.json')

class FormFilling {
  init (stateConfig, options, callback) {
    this.formId = stateConfig.options.formId
    this.target = stateConfig.options.target
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    ctx.formIdToShowToHuman = this.formId
    ctx.formDefaultDataPath = this.target
    flobot.status = 'waitingForHumanInput'
    callback(null)
  }

  leave (flobot, data, callback) {
    flobot.status = 'running'
    const ctx = flobot.ctx
    delete ctx.formIdToShowToHuman
    delete ctx.formDefaultDataPath
    ctx[this.target] = data
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: FormFilling,
  schema: schema
}
