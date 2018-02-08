'use strict'

const schema = require('./schema.json')
const HlPgClient = require('hl-pg-client')

class AuditService {
  boot (options, callback) {
    const connectionString = process.env.PG_CONNECTION_STRING || ''
    this.pgScripts = options.blueprintComponents.pgScripts || {}

    if (connectionString) {
      this.client = new HlPgClient(connectionString)

      const promises = Object.keys(this.pgScripts).map(script => {
        return this.client.runFile(this.pgScripts[script].filePath)
      })

      Promise.all(promises)
        .then(() => {
          console.log('done')
          callback(null)
        })
        .catch(err => {
          console.log('ERR:', err)
        })
    }
  }

  async shutdown () {
    await this.client.end()
  }
}

module.exports = {
  schema: schema,
  serviceClass: AuditService,
  bootAfter: ['storage']
}
