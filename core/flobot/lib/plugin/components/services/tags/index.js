'use strict'

const async = require('async')
const _ = require('lodash')
const sprintf = require('sprintf-js').sprintf

class TagsService {
  boot (options, callback) {
    const _this = this

    const storage = options.bootedServices.storage

    this.tags = {}
    this.tagModel = storage.models.fbot_tag

    this.ensureTags(options.blueprintComponents.tags, options.messages, function (err) {
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

  ensureTags (blueprintTags, messages, callback) {
    const _this = this

    if (blueprintTags) {
      async.forEachOf(
        blueprintTags,

        function (tag, name, cb) {
          _this.tagModel.findOne(
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

                  _this.tagModel.create(
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
   * Reloads all tags from storage (i.e. the `fbot_tag_1_0` model)
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
    this.tagModel.find(
      {},
      function (err, storedTags) {
        if (err) {
          callback(err)
        } else {
          _this.tags = _.reduce(
            storedTags,
            function (result, value, key) {
              result[value.name] = {
                tag: value.name,
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
  serviceClass: TagsService,
  bootAfter: ['storage']
}
