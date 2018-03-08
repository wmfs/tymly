const solr = require('solr-client')
const _ = require('lodash')

class AddDocs {
  init (resourceConfig, env, callback) {
    this.schema = require('./schema.json')
    this.env = env
    this.core = resourceConfig.core
    this.services = env.bootedServices
    this.mapping = resourceConfig.mapping
    callback(null)
  }

  run (event, context) {
    const data = _.isArray(event) ? event : [event]
    const docs = data.map(d => {
      const doc = {}
      Object.keys(this.mapping).map(mapKey => {
        if (this.mapping[mapKey] === '$NOW') {
          doc[mapKey] = new Date()
        } else if (_.isString(this.mapping[mapKey])) {
          const cast = this.mapping[mapKey].split('::')[1]
          if (cast === 'text[]') {
            doc[mapKey] = this.mapping[mapKey].split('::')[0].replace(/\s+/g, '').split(',')
          } else {
            const string = this.mapping[mapKey].split('||').map(m => d[m] ? d[m] : m)
            doc[mapKey] = string.join('')
          }
        } else {
          doc[mapKey] = this.mapping[mapKey]
        }
      })
      return doc
    })

    this.solrClient.add(docs, (err) => {
      if (err) return context.sendTaskFailure({error: 'addDocsFail', cause: err})
      this.solrClient.commit((err, obj) => {
        if (err) return context.sendTaskFailure({error: 'addDocsFail', cause: err})
        context.sendTaskSuccess()
      })
    })
  }

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

    this.solrClient_.autoCommit = true

    return this.solrClient_
  }
}

module.exports = AddDocs
