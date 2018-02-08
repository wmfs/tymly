'use strict'

const path = require('path')
const schema = require('./schema.json')
const HlPgClient = require('hl-pg-client')
const generateTriggerStatement = require('./generate-trigger-statement')

class AuditService {
  boot (options, callback) {
    const connectionString = process.env.PG_CONNECTION_STRING || ''
    this.pgScripts = options.blueprintComponents.pgScripts || {}
    this.models = options.blueprintComponents.models || {}

    if (connectionString) {
      this.client = new HlPgClient(connectionString)
      this.auditFunctions = []

      const promises = Object.keys(this.pgScripts).map(script => {
        const filename = path.parse(this.pgScripts[script].filename).name
        this.auditFunctions.push(filename.substring(filename.indexOf('-') + 1))
        if (filename.split('-')[0] === 'audit') {
          return this.client.runFile(this.pgScripts[script].filePath)
        }
      })

      Promise.all(promises)
        .then(async () => {
          await this.updateTriggers()
          callback(null)
        })
        .catch(err => {
          console.log('ERR:', err)
          callback(err)
        })
    }
  }

  updateTriggers () {
    this.auditFunctions.map(func => {
      Object.keys(this.models).map(async model => {
        const audit = this.models[model].audit !== false
        const triggerSQL = generateTriggerStatement({
          model: this.models[model],
          function: func,
          action: audit ? 'ADD' : 'REMOVE'
        })
        await this.client.query(triggerSQL)
      })
    })
  }

  async shutdown () {
    await this.client.end()
  }
}

module.exports = {
  schema: schema,
  serviceClass: AuditService,
  bootAfter: ['storage', 'statebox']
}
