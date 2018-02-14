'use strict'

const requestPromise = require('request-promise-native')

class GetDataFromRestApi {
  init (resourceConfig, env, callback) {
    const registry = env.bootedServices.registry
    this.templateUrl = registry.get(resourceConfig.namespace + '_' + resourceConfig.templateUrlRegistryKey)
    if (resourceConfig.authTokenRegistryKey) this.authToken = registry.get(resourceConfig.namespace + '_' + resourceConfig.authTokenRegistryKey)
    if (resourceConfig.resultPath) this.resultPath = resourceConfig.resultPath
    if (resourceConfig.paramPath) this.paramPath = resourceConfig.paramPath
    callback(null)
  }

  run (event, context) {
    if (this.paramPath) {
      Object.keys(event[this.paramPath]).map(key => {
        this.templateUrl = this.templateUrl.replace(`{{${key}}}`, event[this.paramPath][key])
      })
    }

    const options = {
      uri: this.templateUrl,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      resolveWithFullResponse: true
    }

    if (this.authToken) options.headers.Authorization = this.authToken

    requestPromise(options)
      .then((result) => {
        if (result.statusCode.toString()[0] === '2') {
          if (this.resultPath) return context.sendTaskSuccess({[this.resultPath]: result.body[this.resultPath]})
          context.sendTaskSuccess(result.body)
        } else {
          console.log(`Tried to GET '${this.templateUrl}' with '${this.authToken}' ` +
            `but received ${result.statusCode}: ${result.statusMessage}`)
          context.sendTaskFailure({
            statusCode: result.statusCode,
            cause: result.statusMessage
          })
        }
      })
  }
}

module.exports = GetDataFromRestApi
