'use strict'

const async = require('async')
const _ = require('lodash')
const dottie = require('dottie')

class RegistryService {
  boot (options, callback) {
    const _this = this
    const storage = options.bootedServices.storage

    this.registry = {}
    this.registryKeyModel = storage.models.fbot_registryKey
    this.blueprintRegistryKeys = options.blueprintComponents.registryKeys || {}

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
    }
    )
  }

  ensureBlueprintKeys (messages, callback) {
    const _this = this

    if (_this.blueprintRegistryKeys) {
      async.forEachOf(
        _this.blueprintRegistryKeys,

        function (value, key, cb) {
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
                  const defaultValue = dottie.get(value, 'schema.properties.value.default')

                  _this.registryKeyModel.create(
                    {
                      key: key,
                      value: {value: defaultValue}
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
   * Reloads all registry key/values from storage (i.e. the `fbot_registryKey_1_0` model)
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
    const _this = this
    this.registryKeyModel.find(
      {},
      function (err, storedRegistry) {
        if (err) {
          callback(err)
        } else {
          _this.registry = _.reduce(
            storedRegistry,
            function (result, value, key) {
              result[value.key] = {
                value: value.value.value, // Oh my.
                meta: _this.blueprintRegistryKeys[value.key]
              }
              return result
            },
            {}
          )

          callback(null)
        }
      }
    )
  }

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
    for (const rootKey in source) {
      if (source.hasOwnProperty(rootKey)) {
        root = source[rootKey]
        root = dottie.get(root, rootPath)
        applySubstitutions(root)
      }
    }

    return source
  }
}

module.exports = {
  serviceClass: RegistryService,
  bootAfter: ['storage'],
  bootBefore: ['statebox']
}
