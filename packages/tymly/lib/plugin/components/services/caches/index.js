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

  /**
   * Associates the specified value with the specified key in the specified cache
   * Note that this will update the "recently used"-ness of the key.
   * @param cacheName the cache identifier
   * @param key key with the specified value is to be associated
   * @param value the value to be associated with the specified key
   * @param maxAge optional parameter, which overrides the cache configuration if provided
   * @returns {undefined}
   */
  set (cacheName, key, value, maxAge) {
    if (maxAge) {
      this[cacheName].set(key, value, maxAge)
    } else {
      this[cacheName].set(key, value)
    }
  }

  /**
   * Returns the value to which the specified key is mapped, or {undefined} is the cache contains no mapping for the key
   * Note that this will update the "recently used"-ness of the key.
   * @param cacheName the cache identifier
   * @param key the key whose associated value is to be returned
   * @returns the value to which the specified key is mapped or {undefined} if this cache contains no mapping for the key
   */
  get (cacheName, key) {
    return this[cacheName].get(key)
  }

  /**
   * Checks if a key is in the specified cache, without updating the recent-ness or deleting it for being stale
   * @param cacheName the cache identifier
   * @param key the key whose presence in the indicated cache is to be tested
   * @returns {true} if the indicated cache contains a mapping for the specified key, {false} otherwise
   */
  has (cacheName, key) {
    return this[cacheName].has(key)
  }

  /**
   * Deletes a mapping with the key from the specified cache if present
   * @param cacheName the cache identifier
   * @param key the key whose mapping is to be removed from the specified cache
   * @returns {undefined}
   */
  del (cacheName, key) {
    this[cacheName].del(key)
  }

  /**
   * Clears the specified cache entirely, throwing away all values
   * @param cacheName the cache identifier
   */
  reset (cacheName) {
    this[cacheName].reset()
  }
}

module.exports = {
  schema: schema,
  serviceClass: CacheService
}
