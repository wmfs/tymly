const path = require('path')

module.exports = function installTestSchemas (filename, client, callback) {
  client.runFile(path.resolve(__dirname, filename), callback)
}
