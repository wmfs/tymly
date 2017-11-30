'use strict'

class ResumeForm {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}

module.exports = ResumeForm
