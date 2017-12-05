const ReindexBase = require('../../../impl/reindex-base')

class DeltaReindex extends ReindexBase {
  constructor () {
    super('executeSolrDeltaReindex', 'deltaReindexFail')
  }
}

module.exports = DeltaReindex
