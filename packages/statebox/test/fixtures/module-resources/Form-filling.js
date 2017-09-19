'use strict'

module.exports = class FormFilling {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('WAITING FOR SOMEONE TO FILL-IN A FORM!')
  }
}
