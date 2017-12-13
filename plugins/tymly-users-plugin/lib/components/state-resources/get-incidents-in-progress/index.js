'use strict'

// May not stay in 'users-plugin'
// Could be a state resource to call any rest api for data
// Call relay-rest to get the incidents in progress and return a populated array

class GetIncidentsInProgress {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('State Resource: GetIncidentsInProgress')
    const incidents = [
      {
        incidentNumber: 1,
        callTime: '2017-04-15T18:49:48.000Z',
        callTimeYear: 2017
      },
      {
        incidentNumber: 2,
        callTime: '2017-04-15T13:10:48.000Z',
        callTimeYear: 2017
      }
    ]
    context.sendTaskSuccess({incidents})
  }
}

module.exports = GetIncidentsInProgress
