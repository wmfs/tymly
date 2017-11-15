const path = require('path')
const async = require('async')

module.exports = function installTestSchemas (filenames, client, callback) {
  async.eachSeries(
    filenames,
    (filename, cb) => client.runFile(path.resolve(__dirname, path.join('scripts', filename)), cb),
    callback
  )
}
