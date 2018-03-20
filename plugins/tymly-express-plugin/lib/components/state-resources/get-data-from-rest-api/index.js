'use strict'

const requestPromise = require('request-promise-native')

class GetDataFromRestApi {
  init (resourceConfig, env, callback) {
    this.registry = env.bootedServices.registry
    this.namespace = resourceConfig.namespace
    this.templateUrlRegistryKey = resourceConfig.templateUrlRegistryKey

    if (resourceConfig.authTokenRegistryKey) this.authToken = this.registry.get(resourceConfig.namespace + '_' + resourceConfig.authTokenRegistryKey)
    if (resourceConfig.resultPath) this.resultPath = resourceConfig.resultPath
    if (resourceConfig.paramPath) this.paramPath = resourceConfig.paramPath

    this.webAPITimeoutInMilliseconds = (process.env.WEB_API_TIMEOUT_IN_MS || 3000)

    if (process.env.PROXY_URL) {
      this.requestPromise = requestPromise.defaults({'proxy': process.env.PROXY_URL})
    } else {
      this.requestPromise = requestPromise.defaults()
    }

    callback(null)
  }

  run (event, context) {
    this.templateUrl = this.registry.get(this.namespace + '_' + this.templateUrlRegistryKey)
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
      resolveWithFullResponse: true,
      timeout: this.webAPITimeoutInMilliseconds
    }

    if (this.authToken) options.headers.Authorization = this.authToken

    this.requestPromise(options)
      .then((result) => {
        switch (result.statusCode) {
          case 200: // OK
            if (this.resultPath) context.sendTaskSuccess({[this.resultPath]: result.body[this.resultPath]})
            else context.sendTaskSuccess(result.body)
            break
          case 204: // No content
            if (this.resultPath) context.sendTaskSuccess({[this.resultPath]: []})
            else context.sendTaskSuccess([])
            break
          default:
            console.log(`Tried to GET '${this.templateUrl}' with '${this.authToken}' ` +
              `but received ${result.statusCode}: ${result.statusMessage}`)
            context.sendTaskFailure({statusCode: result.statusCode, cause: result.statusMessage})
            break
        }
      })
  }
}

module.exports = GetDataFromRestApi
