const async = require('async')
const promisify = require('util').promisify

// note that statementsAndParams should be an array of objects, where each
// object has a sql (string) property and a params (array) property
function pgScriptRunner (client, statementsAndParams, callback) {
  ensureBeginAndEnd(statementsAndParams)

  let i = -1
  async.eachSeries(
    statementsAndParams,
    function (data, cb) {
      i++

      client.query(
        data.sql,
        data.params,
        cb
      )
    },
    function (err) {
      if (err) {
        console.error('')
        console.error('scriptRunner fail!')
        console.error('------------------')
        console.error()
        console.error(JSON.stringify(statementsAndParams[i], null, 2))
        console.error(err)
        console.error('')
        client.query(
          'ROLLBACK;',
          function (rollbackErr) {
            if (rollbackErr) {
              console.error('FAILED TO ROLLBACK AS WELL! ' + rollbackErr)
            } else {
              console.log('ROLLBACK SUCCESSFUL.')
            }
            callback(err)
          }
        )
      } else {
        callback(null)
      }
    }
  )
} // pgScriptRunner

const pgScriptRunnerP = promisify(pgScriptRunner)

function ensureBeginAndEnd (statementsAndParams) {
  if (statementsAndParams.length > 0 && statementsAndParams[0].sql !== 'BEGIN') {
    statementsAndParams.unshift({
      'sql': 'BEGIN',
      'params': []
    })
  }

  if (statementsAndParams.length > 0 && statementsAndParams[statementsAndParams.length - 1].sql !== 'END;') {
    statementsAndParams.push({
      'sql': 'END;',
      'params': []
    })
  }
} // ensureBeginAndEnd

const NotSet = 'NotSet'
module.exports = function (client, statementsAndParams, callback = NotSet) {
  if (callback === NotSet) {
    return pgScriptRunnerP(client, statementsAndParams)
  }
  pgScriptRunner(client, statementsAndParams, callback)
}
