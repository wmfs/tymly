'use strict'

module.exports = class CancelDiaryEntry {
  init (resourceConfig, env, callback) {
    this.services = env.bootedServices
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    callback(null)
  }

  run (event, context) {
    this.entryModel.destroyById(event, err => {
      if (err) return context.sendTaskFailure({error: 'cancelDiaryEntryFail', cause: err})
      context.sendTaskSuccess()
    })
  }
}
