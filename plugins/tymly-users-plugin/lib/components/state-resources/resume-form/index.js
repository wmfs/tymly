'use strict'

class ResumeForm {
  init (resourceConfig, env, callback) {
    this.models = env.bootedServices.storage.models
    callback(null)
  }

  run (event, context) {
    const model = this.models[`tymly_${event.model}`]
    model.findById(event.formId, (err, doc) => {
      if (err) context.sendTaskFailure(err)
      context.sendTaskSuccess({form: doc})
    })
  }
}

module.exports = ResumeForm
