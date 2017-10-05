'use strict'

const async = require('async')
const debug = require('debug')('supercopy')
const fs = require('fs')
const copyFrom = require('pg-copy-streams').from
const _ = require('lodash')
module.exports = function scriptRunner (statements, client, options, callback) {
  let i = -1
  async.eachSeries(
    statements,
    function (statement, cb) {
      const onceCb = _.once(cb)
      i++
      if (statement.startsWith('COPY ')) {
        const components = statement.match(/COPY (.*?) FROM '([^']*)'/)
        const tableAndCols = components[1]
        const filename = components[2]
        const newStatement = `COPY ${tableAndCols} FROM STDIN CSV HEADER;`
        debug(`Stream-Copy: ${newStatement} -- (${filename})`)
        const stream = client.query(
          copyFrom(newStatement)
        )
        stream.on('end', function () {
          onceCb()
        }).on('error', function (err) {
          onceCb(err)
        })

        const fileStream = fs.createReadStream(filename)
        fileStream.on('error', function (err) {
          onceCb(err)
        })

        fileStream.pipe(stream)
      } else {
        debug(`Running: ${statement}`)
        client.query(
          statement,
          [],
          onceCb
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
