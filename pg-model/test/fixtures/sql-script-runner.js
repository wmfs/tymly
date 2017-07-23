const fs = require('fs')
const path = require('path')
const async = require('async')

module.exports = function installTestSchemas (filenames, client, callback) {
  async.eachSeries(
    filenames,
    function (filename, cb) {
      fs.readFile(
        path.resolve(__dirname, path.join('scripts', filename)),
        'utf8',
        function (err, sql) {
          if (err) {
            callback(err)
          } else {
            client.query(
              sql,
              cb
            )
          }
        }
      )
    },
    callback
  )
}
