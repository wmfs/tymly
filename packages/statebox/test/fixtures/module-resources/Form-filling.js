'use strict'

module.exports = class FormFilling {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context, done) {
    console.log('WAITING FOR SOMEONE TO FILL-IN A FORM!')
    context.sendTaskHeartbeat(
      {
        formId: 'fillThisFormInHuman!'
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
