const async = require('async')

module.exports = function pgScriptRunner (client, statements, callback) {
  if (statements.length > 0 && statements[0] !== 'BEGIN') {
    statements.unshift('BEGIN')
  }

  if (statements[statements.length - 1] !== 'END;') {
    statements.push('END;')
  }

  let i = -1
  async.eachSeries(
    statements,
    function (statement, cb) {
      i++

      // console.log(`${i}: ${statement}`)

      client.query(
        statement,
        [],
        cb
      )
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
