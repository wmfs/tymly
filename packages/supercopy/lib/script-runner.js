'use strict'

const async = require('async')
const debug = require('debug')('supercopy')

module.exports = function scriptRunner (statements, client, callback) {
  let i = -1
  async.eachSeries(
    statements,
    function (statementAndParam, cb) {
      const statement = statementAndParam.sql
      const action = statementAndParam.action

      if (action) {
        action(statement, null, client).
          then(() => cb()).
          catch(err => cb(err))
      } else {
        debug(`Running: ${statement}`)
        client.query(
          statement,
          [],
          cb
        )
      }
    },
    function (err) {
      if (err) {
        console.error('')
        console.error('scriptRunner fail!')
        console.error('------------------')
        console.error()
        console.error(JSON.stringify(statements[i], null, 2))
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
}
