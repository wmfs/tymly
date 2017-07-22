const async = require('async')

module.exports = function scriptRunner (model, script, callback) {
  script.push(
    {
      statement: 'END;'
    }
  )

  const ctx = {}
  let i = -1

  async.eachSeries(
    script,
    function (scriptEntry, cb) {
      i++
      // preStatementHook
      if (scriptEntry.preStatementHook) {
        scriptEntry.preStatementHook(scriptEntry, ctx)
      }

      // console.log(i, scriptEntry.statement + '  ' + JSON.stringify(scriptEntry.values))

      model.client.query(
        scriptEntry.statement,
        scriptEntry.values,
        function (err, result) {
          if (err) {
            cb(err)
          } else {
            if (scriptEntry.postStatementHook) {
              scriptEntry.postStatementHook(result, ctx)
            }

            cb(null)
          }
        }
      )
    },
    function (err) {
      if (err) {
        console.error('')
        console.error('scriptRunner fail!')
        console.error('------------------')
        console.error()
        console.error(JSON.stringify(script[i], null, 2))
        console.error(err)
        console.error('')
        model.client.query(
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
        callback(null, ctx.returnValue)
      }
    }
  )
}
