'use strict'

const rest = require('restler')

class GetDataFromRestApi {
  init (resourceConfig, env, callback) {
    this.resultPath = resourceConfig.resultPath
    this.registry = env.bootedServices.registry
    this.templateUrl = this.registry.get('tymly_' + resourceConfig.templateUrlRegistryKey)
    if (resourceConfig.authTokenRegistryKey) this.authToken = this.registry.get('tymly_' + resourceConfig.authTokenRegistryKey)
    callback(null)
  }

  run (event, context) {
    const options = {
      headers: {
        Accept: '*/*'
      }
    }

    if (this.authToken) options.headers.Authorization = this.authToken
    rest.get(this.templateUrl, options).on('complete', (result, response) => {
      if (response.statusCode.toString()[0] === '2') {
        context.sendTaskSuccess({[this.resultPath]: result[this.resultPath]})
      } else {
        context.sendTaskFailure({
          statusCode: response.statusCode,
          cause: response.statusMessage
        })
      }
    })
  }
}

module.exports = GetDataFromRestApi
