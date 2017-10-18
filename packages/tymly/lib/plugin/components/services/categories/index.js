'use strict'

const async = require('async')
const _ = require('lodash')
const sprintf = require('sprintf-js').sprintf

class CategoryService {
  boot (options, callback) {
    const _this = this

    const storage = options.bootedServices.storage

    this.categories = {}
    this.categoryModel = storage.models.tymly_category

    this.ensureCategories(options.blueprintComponents.categories, options.messages, function (err) {
      if (err) {
        callback(err)
      } else {
        _this.refresh(function (err) {
          if (err) {
            callback(err)
          } else {
            options.messages.info('Tags loaded')
            callback(null)
          }
        })
      }
    }
    )
  }

  ensureCategories (blueprintTags, messages, callback) {
    const _this = this

    if (blueprintTags) {
      async.forEachOf(
        blueprintTags,

        function (tag, name, cb) {
          _this.categoryModel.findOne(
            {
              where: {
                name: {equals: tag.name}
              }
            },
            function (err, doc) {
              if (err) {
                cb(err)
              } else {
                if (doc) {
                  // Tag already in storage, move on
                  cb(null)
                } else {
                  // Tag not in storage, go create

                  const newDoc = {
                    name: tag.name,
                    label: tag.label || tag.name,
                    styling: tag.styling || {}
                  }

                  _this.categoryModel.create(
                    newDoc,
                    {},
                    function (err) {
                      if (err) {
                        cb(err)
                      } else {
                        messages.info(sprintf('Added %s', newDoc.name))
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
   * Reloads all tags from storage (i.e. the `tymly_tag_1_0` model)
   * @param {Function} callback Called with all loaded tags
   * @returns {undefined}
   * @example
   * registry.refresh(
   *   function (err, tags) {
   *     // Tags as loaded from storage
   *     // Key/value pairs, where key is the tag ID and value is an object:
   *     // {
   *     //  tag: Tag name
   *     //  label: Tag label
   *     //  styling: Tag styling
   *     // }
   *   }
   * )
   */
  refresh (callback) {
    const _this = this
    this.categoryModel.find(
      {},
      function (err, storedTags) {
        if (err) {
          callback(err)
        } else {
          _this.categories = _.reduce(
            storedTags,
            function (result, value, key) {
              result[value.name] = {
                category: value.name,
                label: value.label,
                styling: value.styling
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
}

module.exports = {
  serviceClass: CategoryService,
  bootAfter: ['storage']
}
