
class BlueprintDocsService {
  boot (options, callback) {
    this.storage = options.bootedServices
    const models = options.bootedServices.storage.models
    this.blueprintDocDao = models.tymly_blueprintDoc
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
   *   'tymlyTest_tymlyTestAdmin',
   *   function (err, isKnown) {
   *     // 'isKnown' is boolean and indicates if this document
   *     // has been previously added at boot-time.
   *   }
   * )
   */
  isKnownDocument (domain, docId) {
    return this.blueprintDocDao.findOne({
      where: {
        domain: {equals: domain},
        docId: {equals: docId}
      }
    })
      .then(doc => !(doc === null))
  }

  /**
   * Record that a blueprint has just creating a document in a model.
   * @param {string} domain For grouping documents that have been created, often relate to a model name
   * @param {string} docId An id for the document that's being registered (should be unique within its domain)
   * @param {Function} callback Called with the registered document (e.g. a doc stored via the `tymly.blueprintDocs` model, pretty useless)
   * @returns {Promise}
   * @example
   * blueprintDocs.registerDocument(
   *   'templateRole',
   *   'tymlyTest_tymlyTestAdmin'
   * )
   */
  registerDocument (domain, docId) {
    return this.blueprintDocDao.create({
      domain: domain,
      docId: docId
    },
    {}
    )
  } // registerDocument

  getDomainDocIds (domain) {
    return this.blueprintDocDao.find({
      where: {
        domain: {equals: domain}
      }
    })
      .then(docs => docs.map(d => d.docId))
  }
}

module.exports = {
  serviceClass: BlueprintDocsService,
  bootAfter: ['storage'],
  bootBefore: ['statebox']
}
