'use strict'

module.exports = class CancelDiaryEntry {
  init (resourceConfig, env, callback) {
    console.log('env: ', env)
    this.services = env.bootedServices
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    callback(null)
  }

  run (event, context) {
    console.log('event: ', event)
    // console.log('context: ', context)
    const id = event
    this.entryModel.destroyById(id, err => {
      if (err) return context.sendTaskFailure({error: 'cancelDiaryEntryFail', cause: err})
      context.sendTaskSuccess()
    })
  }
}
