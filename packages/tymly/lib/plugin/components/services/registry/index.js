'use strict'

const async = require('async')
const _ = require('lodash')
const dottie = require('dottie')

const cacheName = 'registryKeys'

class RegistryService {
  boot (options, callback) {
    const _this = this
    const storage = options.bootedServices.storage
    this.caches = options.bootedServices.caches
    if (this.caches !== undefined) this.caches.defaultIfNotInConfig(cacheName, 1000)

    this.bootedRegistry = options.bootedServices.registry

    this.registry = {}
    this.registryKeyModel = storage.models.tymly_registryKey // just describes the registry-key table (columns, etc.)
    this.blueprintRegistryKeys = options.blueprintComponents.registryKeys || {} // the registry-keys from the blueprint

    this.ensureBlueprintKeys(options.messages, function (err) {
      if (err) {
        callback(err)
      } else {
        _this.refresh(function (err) {
          if (err) {
            callback(err)
          } else {
            options.messages.info('Registry loaded')
            callback(null)
          }
        })
      }
    })
  }

  /*
  * If the registry key already exists in DB then do nothing,
  * else create the row in the DB
  * */
  ensureBlueprintKeys (messages, callback) {
    const _this = this
    let environmentVariable

    if (_this.blueprintRegistryKeys) {
      async.forEachOf(
        _this.blueprintRegistryKeys,

        function (value, key, cb) {
          let defaultValue
          _this.registryKeyModel.findById(
            key,
            function (err, doc) {
              if (err) {
                cb(err)
              } else {
                if (doc) {
                  // Key already in storage, move on
                  cb(null)
                } else {
                  // Key not in storage, go create
                  environmentVariable = dottie.get(value, 'schema.properties.environmentVariableName')
                  if (process.env[dottie.get(value, 'schema.properties.environmentVariableName')]) {
                    defaultValue = process.env[dottie.get(value, 'schema.properties.environmentVariableName')]
                  } else {
                    if (dottie.get(value, 'schema.properties.value.default')) {
                      defaultValue = dottie.get(value, 'schema.properties.value.default')
                    } else {
                      defaultValue = null
                    }
                  }
                  _this.registryKeyModel.create(
                    {
                      key: key,
                      environmentVariableName: environmentVariable,
                      value: {
                        value: defaultValue
                      }
                    },
                    {},
                    function (err) {
                      if (err) {
                        cb(err)
                      } else {
                        messages.info('Added key: ' + key + ' = ' + defaultValue)
                        cb(null)
                      }
                    }
                  )
                }
              }
            }
          )
        },

        callback
      )
    } else {
      callback(null)
    }
  }

  /**
   * Reloads all registry key/values from storage (i.e. the `tymly_registryKey_1_0` model)
   * @param {Function} callback Called with all key/value pairs currently stored in the registry
   * @returns {undefined}
   * @example
   * registry.refresh(
   *   function (err, registryKeyValues) {
   *     // Actually 'registryKeyValues' is more:
   *     // {
   *     //   mkKey: {
   *     //     value: 'VALUE!', <--- Value of the 'myKey' key
   *     //     meta: {...} <--- Some info about the key
   *     //   }
   *     // }
   *   }
   * )
   */
  refresh (callback) {
    this.registryKeyModel.find({})
      .then(storedRegistry => {
        /*
         * storedRegistry is the rows from the DB
         * _this.registry is empty before the reduce
         * _this.registry gets populated after the reduce with what's in storedRegistry
         */
        this.registry = storedRegistry.reduce((result, value) => {
          result[value.key] = {
            value: value.value.value, // Easy now
            meta: this.blueprintRegistryKeys[value.key]
          }
          return result
        }, {})

        callback(null)
      }
      )
      .catch(err => callback(err))
  } // refresh

  substitute (namespace, source, rootPath) {
    const _this = this

    function applySubstitutions (root) {
      if (_.isArray(root)) {
        // TODO: Errm, shouldn't this be recursive?
      } else if (_.isObject(root)) {
        let rootValue
        let registryKey
        let registryValue
        for (let rootKey in root) {
          if (root.hasOwnProperty(rootKey)) {
            rootValue = root[rootKey]

            if (_.isString(rootValue) && rootValue.substring(0, 10) === '@registry.') {
              registryKey = namespace + '_' + rootValue.slice(10)

              if (_this.registry.hasOwnProperty(registryKey)) {
                registryValue = _this.registry[registryKey].value

                // TODO: Errm, nulls/undefined?
                root[rootKey] = registryValue
              }
            }
          }
        }
      }
    }

    let root
    for (let rootKey in source) {
      if (source.hasOwnProperty(rootKey)) {
        root = source[rootKey]
        root = dottie.get(root, rootPath)
        applySubstitutions(root)
      }
    }

    return source
  }

  get (key) {
    const path = this.caches.get(cacheName, key)
    if (path) {
      return path
    } else {
      const regVal = this.bootedRegistry.registry[key].value
      this.caches.set(cacheName, key, regVal)
      return regVal
    }
  }

  set (key, value, callback) {
    this.registryKeyModel.upsert(
      {
        key: key,
        value: {
          value: value
        }
      },
      {}
    ).then(() => {
      this.caches.set('registryKeys', key, value)
      this.refresh(callback)
    }
    ).catch(err => callback(err))
  } // set
}

module.exports = {
  serviceClass: RegistryService,
  bootAfter: ['storage', 'caches'],
  bootBefore: ['statebox']
}
