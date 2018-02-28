'use strict'

const solr = require('solr-client')
const debug = require('debug')('remove-docs')

class removeDocs {
  init (resourceConfig, env, callback) {
    this.schema = require('./schema.json')
    this.services = env.bootedServices
    this.query = resourceConfig.query
    callback(null)
  } // init

  get solrClient () {
    if (this.solrClient_) {
      return this.solrClient_
    }

    const solrConnection = this.services.solr.solrConnection
    this.solrClient_ = solr.createClient({
      host: solrConnection.host,
      port: solrConnection.port,
      path: solrConnection.path,
      core: 'tymly'
    })

    return this.solrClient_
  } // solrClient

  run (event, context) {
    const query = Object.keys(this.query).map(q => `${q}:${this.query[q]}`)

    debug(`Deleteing docs where ${query.join(' AND ')}`)

    this.solrClient.deleteByQuery(query.join(' AND '), (err, obj) => {
      if (err) return context.sendTaskFailure({error: 'removeDocsFail', cause: err})
      this.solrClient.commit((err, res) => {
        if (err) return context.sendTaskFailure({error: 'removeDocsFail', cause: err})
        context.sendTaskSuccess()
      })
    })
  } // run
}

module.exports = removeDocs
