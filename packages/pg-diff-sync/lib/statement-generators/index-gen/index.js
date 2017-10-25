const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function indexStatementGenerator (indexId, index, statements) {
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
    console.log('!!!!', template(ctx))
    statements.push(
      template(ctx)
    )
  }
}
