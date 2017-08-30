'use strict'

const async = require('async')

module.exports = function (executionName, expectedStatus, statebox, callback) {
  let executionDescription = {}
  async.doUntil(
    function (cb) {
      statebox.describeExecution(
        executionName,
        function (err, latestExecutionDescription) {
          if (err) {
            cb(err)
          } else {
            executionDescription = latestExecutionDescription
            cb(null, latestExecutionDescription)
          }
        }
      )
    },
    function () {
      return executionDescription.status === expectedStatus
    },
    function (err, finalExecutionDescription) {
      if (err) {
        callback(err)
      } else {
        callback(null, finalExecutionDescription)
      }
    }
  )
}
