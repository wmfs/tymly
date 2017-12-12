'use strict'

// May not stay in 'users-plugin'
// Could be a state resource to call any rest api for data
// Call relay-rest to get the incidents in progress and return a populated arrray

class GetIncidentsInProgress {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('State Resource: GetIncidentsInProgress')
    const incidents = ['incident 1', 'incident 2']
    context.sendTaskSuccess({incidents})
  }
}

module.exports = GetIncidentsInProgress
