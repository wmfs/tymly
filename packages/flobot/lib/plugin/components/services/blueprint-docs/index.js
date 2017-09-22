'use strict'

const _ = require('lodash')

class BlueprintDocsService {
  boot (options, callback) {
    this.storage = options.bootedServices
    const models = options.bootedServices.storage.models
    this.blueprintDocDao = models.fbot_blueprintDoc
    callback(null)
  }

  /**
   * During boot-up a blueprint might like to throw some documents into storage (e.g. some relevant roles or similar). A user is free to change the contents of that initial document, and even delete it if it's not of use. Use `isKnownDocument` to derive if the document has been previously added by the blueprint - i.e. it shouldn't be re-introduced.
   * @param {string} domain For grouping documents that have been created
   * @param {string} docId An id for the document that's being registered (should be unique within its domain)
   * @param {Function} callback Called `true` or `false`
   * @returns {undefined}
   * @example
   * blueprintDocs.isKnownDocument(
   *   'templateRole',
   *   'fbotTest_fbotTestAdmin',
   *   function (err, isKnown) {
   *     // 'isKnown' is boolean and indicates if this document
   *     // has been previously added at boot-time.
   *   }
   * )
   */
  isKnownDocument (domain, docId, callback) {
    this.blueprintDocDao.findOne(
      {
        where: {
          domain: {equals: domain},
          docId: {equals: docId}
        }
      },
      function (err, doc) {
        if (err) {
          callback(err)
        } else {
          callback(null, !(doc === null))
        }
      }
    )
  }

  /**
   * Record that a blueprint has just creating a document in a model.
   * @param {string} domain For grouping documents that have been created, often relate to a model name
   * @param {string} docId An id for the document that's being registered (should be unique within its domain)
   * @param {Function} callback Called with the registered document (e.g. a doc stored via the `fbot.blueprintDocs` model, pretty useless)
   * @returns {undefined}
   * @example
   * blueprintDocs.registerDocument(
   *   'templateRole',
   *   'fbotTest_fbotTestAdmin',
   *   function (err, blueprintsDocInfo) {
   *     // The returned value here is the doc as now stored
   *     // in the fbot.blueprintDocs model... not that
   *     // much use, just deal with errors?
   *   }
   * )
   */
  registerDocument (domain, docId, callback) {
    this.blueprintDocDao.create(
      {
        domain: domain,
        docId: docId
      },
      {},
      callback
    )
  }

  getDomainDocIds (domain, callback) {
    this.blueprintDocDao.find(
      {
        where: {
          domain: {equals: domain}
        }
      },
      function (err, docs) {
        if (err) {
          callback(err)
        } else {
          callback(null, _.map(docs, 'docId'))
        }
      }
    )
  }
}

module.exports = {
  serviceClass: BlueprintDocsService,
  bootAfter: ['storage'],
  bootBefore: ['statebox']
}
