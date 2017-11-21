const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function indexStatementGenerator (indexId, index, statements) {
  switch (index.target.columns[0]) {
    case 'created':
      index.target.columns[0] = '_created'
      break
    case 'created_by':
      index.target.columns[0] = '_created_by'
      break
    case 'modified':
      index.target.columns[0] = '_modified'
      break
    case 'modified_by':
      index.target.columns[0] = '_modified_by'
      break
  }

  const parts = indexId.split('.')
  const tableId = parts[0] + '.' + parts[1]
  const indexName = parts[2]

  const ctx = {
    indexName: indexName,
    tableId: tableId,
    unique: index.target.unique,
    columns: index.target.columns,
    method: index.target.method || 'btree'
  }

  if (!ctx.columns.join()) {
    return
  }

  if (_.isUndefined(index.base)) {
    statements.push(
      template(ctx)
    )
  }
}
