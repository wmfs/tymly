const async = require('async')
const debug = require('debug')('supercopy')
const fs = require('fs')
const copyFrom = require('pg-copy-streams').from

module.exports = function scriptRunner (statements, client, options, callback) {
  let i = -1
  async.eachSeries(
    statements,
    function (statement, cb) {
      i++

      if (statement.startsWith('COPY ')) {
        const components = statement.match(/COPY (.*?) FROM '([^']*)'/)
        const tableAndCols = components[1]
        const filename = components[2]
        const newStatement = `COPY ${tableAndCols} FROM STDIN CSV HEADER;`
        debug(`Running: ${newStatement} -- (${filename})`)
        const stream = client.query(
          copyFrom(newStatement)
        )
        const fileStream = fs.createReadStream(filename)
        fileStream.on('error', cb)
        fileStream.pipe(stream).on('finish', cb).on('error', cb)
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
