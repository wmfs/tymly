'use strict'
module.exports = class FormFilling {
  init (resourceConfig, env, callback) {
    this.formId = resourceConfig.formId
    callback(null)
  }

  run (event, context) {
    context.sendTaskHeartbeat(
      {
        formIdToShowToHuman: this.formId
      }
    )
  }
}
