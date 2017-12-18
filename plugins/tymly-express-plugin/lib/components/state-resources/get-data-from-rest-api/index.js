'use strict'

const rest = require('restler')

class GetDataFromRestApi {
  init (resourceConfig, env, callback) {
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
    console.log(options, this.templateUrl)
    rest.get(this.templateUrl, options).on('complete', function (result, response) {
      if (response.statusCode.toString()[0] === '2') {
        context.sendTaskSuccess({result})
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
