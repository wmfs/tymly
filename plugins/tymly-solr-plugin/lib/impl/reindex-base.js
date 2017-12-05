class ReindexBase {
  constructor (functionName, errorCode) {
    this.functionName = functionName
    this.errorCode = errorCode
  }

  init (resourceConfig, env, callback) {
    this.solrService = env.bootedServices.solr
    this.core = resourceConfig.core
    callback(null)
  }

  run (event, context) {
    const errorCode = this.errorCode

    this.solrService[this.functionName](this.core, function (err) {
      if (err) {
        context.sendTaskFailure(
          {
            error: errorCode,
            cause: err
          }
                )
      } else {
        context.sendTaskSuccess()
      }
    })
  }
}

module.exports = ReindexBase
