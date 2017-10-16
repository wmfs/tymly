'use strict'

class DeltaReindex {
  init (resourceConfig, env, callback) {
    this.env = env
    this.core = resourceConfig.core
    callback(null)
  }

  run (event, context) {
    const solrService = this.env.bootedServices.solr
    solrService.executeSolrDeltaReindex(this.core, function (err) {
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

module.exports = DeltaReindex
