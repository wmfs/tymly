'use strict'
module.exports = class FormFilling {
  init (resourceConfig, env, callback) {
    this.formId = resourceConfig.formId
    callback(null)
  }

  run (event, context, done) {
    context.sendTaskHeartbeat(
      {
        formIdToShowHuman: this.formId
      },
      function (err, executionDescription) {
        if (err) {
          throw new Error(err)
        } else {
          done(executionDescription)
        }
      }
    )
  }
}
