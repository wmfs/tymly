class ReindexBase {
  constructor (functionName, errorCode, schema) {
    this.functionName = functionName
    this.errorCode = errorCode
    this.schema = schema
  }

  init (resourceConfig, env, callback) {
    this.env = env
    this.core = resourceConfig.core
    callback(null)
  }

  run (event, context) {
    const solrService = this.env.bootedServices.solr
    const errorCode = this.errorCode

    solrService[this.functionName](this.core, function (err) {
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
