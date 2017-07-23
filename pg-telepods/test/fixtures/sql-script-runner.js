const fs = require('fs')
const path = require('path')

module.exports = function installTestSchemas (filename, client, callback) {
  fs.readFile(
    path.resolve(__dirname, filename),
    'utf8',
    function (err, sql) {
      if (err) {
        callback(err)
      } else {
        client.query(
          sql,
          callback
        )
      }
    }
  )
}
