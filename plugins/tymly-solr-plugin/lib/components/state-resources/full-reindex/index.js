const ReindexBase = require('../../../impl/reindex-base')

class FullReindex extends ReindexBase {
  constructor () {
    super('executeSolrFullReindex', 'fullReindexFail', require('./schema.json'))
  }
} // FullReindex

module.exports = FullReindex
