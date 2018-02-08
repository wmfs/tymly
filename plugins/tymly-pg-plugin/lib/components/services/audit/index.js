'use strict'

const schema = require('./schema.json')
const HlPgClient = require('hl-pg-client')
const generateTriggerStatement = require('./generate-trigger-statement')

/*
* Is this service only looking for 'audit' scripts in /pg-scripts?
* */
class AuditService {
  boot (options, callback) {
    const connectionString = process.env.PG_CONNECTION_STRING || ''
    this.pgScripts = options.blueprintComponents.pgScripts || {}
    this.models = options.blueprintComponents.models || {}

    if (connectionString) {
      this.client = new HlPgClient(connectionString)

      const promises = Object.keys(this.pgScripts).map(script => {
        return this.client.runFile(this.pgScripts[script].filePath)
      })

      Promise.all(promises)
        .then(async () => {
          await this.addTriggers()
          callback(null)
        })
        .catch(err => {
          console.log('ERR:', err)
          callback(err)
        })
    }
  }

  addTriggers () {
    Object.keys(this.models).map(async model => {
      const audit = this.models[model].audit !== false
      if (audit) {
        const triggerSql = generateTriggerStatement(this.models[model])
        await this.client.query(triggerSql)
      }
    })
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
