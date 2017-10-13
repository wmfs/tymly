'use strict'

class FullReindex {
  init (resourceConfig, env, callback) {
    this.env = env
    this.core = resourceConfig.core
    callback(null)
  }

  run (event, context) {
    const solrService = this.env.bootedServices.solr
    solrService.executeSolrFullReindex(this.core, function (err) {
      if (err) {
        context.sendTaskFailure(
          {
            error: 'fullReindexFail',
            cause: err
          }
        )
      } else {
        context.sendTaskSuccess()
      }
    })
  }
}

module.exports = FullReindex
