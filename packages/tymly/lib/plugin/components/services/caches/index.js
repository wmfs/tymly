'use strict'
const schema = require('./schema.json')

const LRU = require('lru-cache')

class CacheService {
  boot (options, callback) {
    const config = options.config

    if (config.hasOwnProperty('caches')) {
      for (let cacheName in config.caches) {
        if (config.caches.hasOwnProperty(cacheName)) {
          options.messages.info(cacheName)
          this.defaultIfNotInConfig(cacheName, config.caches[cacheName])
        }
      }
    }
    callback(null)
  }

  /**
   * Any cache defined in the config will be automatically created at boot-time... the `defaultIfNotInConfig` method allows services to explicitly define a required cache if not mentioned in config.
   * @param {string} cacheName Unique name of the cache to create if not in config
   * @param {Object} options As per the config section
   * @returns {undefined}
   * @example
   * caches.defaultIfNotInConfig(
   *   'userMemberships',
   *   {
   *     max: 500
   *   }
   * )
   */
  defaultIfNotInConfig (cacheName, options) {
    if (!this.hasOwnProperty(cacheName)) {
      this[cacheName] = LRU(options)
    }
  }

  set (cacheName, key, value) {
    this[cacheName].set(key, value)
  }

  get (cacheName, key) {
    return this[cacheName].get(key)
  }
}

module.exports = {
  schema: schema,
  serviceClass: CacheService
}
