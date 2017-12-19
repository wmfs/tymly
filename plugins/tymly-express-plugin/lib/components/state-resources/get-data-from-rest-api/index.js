'use strict'

const rest = require('restler')

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
    const options = {
      headers: {
        Accept: '*/*'
      }
    }

    if (this.authToken) options.headers.Authorization = this.authToken

    if (this.paramPath) {
      Object.keys(event[this.paramPath]).map(key => {
        this.templateUrl = this.templateUrl.replace(`{{${key}}}`, event[this.paramPath][key])
      })
    }

    console.log('1 >>>>', this.templateUrl)
    rest.get(this.templateUrl, options).on('complete', (result, response) => {
      console.log('2 >>>>', this.templateUrl)
      if (response.statusCode.toString()[0] === '2') {
        if (this.resultPath) return context.sendTaskSuccess({[this.resultPath]: result[this.resultPath]})
        context.sendTaskSuccess({result})
      } else {
        console.log(`Tried to GET '${this.templateUrl}' with '${this.authToken}' ` +
          `but received ${response.statusCode}: ${response.statusMessage}`)
        context.sendTaskFailure({
          statusCode: response.statusCode,
          cause: response.statusMessage
        })
      }
    })
  }
}

module.exports = GetDataFromRestApi
