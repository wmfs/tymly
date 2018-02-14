const solr = require('solr-client')

class AddDocs {
  init (resourceConfig, env, callback) {
    this.env = env
    this.core = resourceConfig.core
    this.services = env.bootedServices
    this.mapping = resourceConfig.mapping
    callback(null)
  }

  run (event, context) {
    const data = [event]

    const docs = data.map(d => {
      const doc = {}
      Object.keys(this.mapping).map(m => {
        if (d[this.mapping[m]]) {
          doc[m] = d[this.mapping[m]]
        } else {
          doc[m] = this.mapping[m]
          if (this.mapping[m] === '$NOW') {
            doc[m] = new Date()
          }
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
