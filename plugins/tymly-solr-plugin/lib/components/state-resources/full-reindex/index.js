const ReindexBase = require('../../../impl/reindex-base')

class FullReindex extends ReindexBase {
  constructor () {
    super('executeSolrFullReindex', 'fullReindexFail')
  }
} // FullReindex

module.exports = FullReindex
