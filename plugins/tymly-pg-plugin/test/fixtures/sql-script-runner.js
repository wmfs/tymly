const path = require('path')

module.exports = {
  install: client => installTestSchemas('install.sql', client),
  uninstall: client => installTestSchemas('uninstall.sql', client),
  setup: client => installTestSchemas('setup.sql', client),
  cleanup: client => installTestSchemas('cleanup.sql', client)
}

function installTestSchemas (filename, client) {
  return client.runFile(path.resolve(__dirname, path.join('scripts', filename)))
}
